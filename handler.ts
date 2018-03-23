import { Handler, Context, Callback } from 'aws-lambda';
import { Match, MatchWithEventDetails, MatchWithHighScoreDetails } from './model/match';
import { EventSchedule, EventType } from './model/event';

const rp = require('request-promise');
const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const WebsiteS3 = new AWS.S3();

const ServeUI: Handler = (event: any, context: Context, callback: Callback) => {
    const page: string = (event.pathParameters && event.pathParameters.page) ? event.pathParameters.page : 'index.html';
    let type = 'text/html';
    switch (page.split('.')[1]) {
        case 'css':
            type = 'text/css';
            break;
        case 'js':
            type = 'application/javascript';
            break;
        case 'html':
        default:
            type = 'text/html';
            break;
    }
    WebsiteS3.getObject({
        Bucket: process.env.WEBSITE_BUCKET,
        Key: page
    }, (err, data) => {
        if (err) {
            console.error(err, err.stack);
            callback(null, {
                statusCode: 500,
                headers: {
                    'Content-Type': 'text/plain'
                },
                isBase64Encoded: false,
                body: err.message
            });
        } else {
            callback(null, {
                statusCode: 200,
                body: data.Body.toString('ascii'),
                headers: {
                    'Content-Type': type
                },
                isBase64Encoded: false
            });
        }
    })
};

const GetEvents: Handler = (event: any, context: Context, callback: Callback) => {
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/events', callback);
};

const GetEventTeams: Handler = (event: any, context: Context, callback: Callback) => {
    // TODO: remove pagination from this API
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/teams?eventcode='
        + event.pathParameters.eventCode + '&page=' + event.pathParameters.page, callback);
};

const GetTeamAwards: Handler = (event: any, context: Context, callback: Callback) => {
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/awards/' + event.pathParameters.teamNumber, callback);
};

const GetEventScores: Handler = (event: any, context: Context, callback: Callback) => {
    const range = (event.pathParameters.start === event.pathParameters.end) ?
        '?matchNumber=' + event.pathParameters.start :
        '?start=' + event.pathParameters.start + '&end=' + event.pathParameters.end;
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/scores/' +
        event.pathParameters.eventCode + '/' + event.pathParameters.tournamentLevel + range, callback);
};

const GetEventSchedule: Handler = (event: any, context: Context, callback: Callback) => {
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/schedule/' +
        event.pathParameters.eventCode + '/' + event.pathParameters.tournamentLevel + '/hybrid', callback);
};

const GetHighScores: Handler = (event: any, context: Context, callback: Callback) => {
    const params = {
        TableName: 'HighScoresTable'
    };
    return DynamoDB.scan(params, (err, data) => {
        ReturnJsonWithCode(200, data.Items.filter(x => x.year === event.pathParameters.year), callback);
    });
};

const GetOffseasonEvents: Handler = (event: any, context: Context, callback: Callback) => {
    // TODO: implement this stub
};

const UpdateHighScores: Handler = (event: any, context: Context, callback: Callback) => {
    return GetDataFromFIRST(process.env.FRC_CURRENT_SEASON + '/events').then((eventList) => {
        const promises = [];
        const order: EventType[] = [];
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 1);
        for (const _event of eventList.Events) {
            const eventDate = new Date(_event.dateStart);
            if (eventDate < currentDate) {
                promises.push(GetDataFromFIRST(process.env.FRC_CURRENT_SEASON + '/schedule/' + _event.code + '/qual/hybrid'));
                promises.push(GetDataFromFIRST(process.env.FRC_CURRENT_SEASON + '/schedule/' + _event.code + '/playoff/hybrid'));
                order.push({
                    eventCode: _event.code,
                    type: 'qual'
                });
                order.push({
                    eventCode: _event.code,
                    type: 'playoff'
                });
            }
        }
        Promise.all(promises).then((events) => {
            // TODO: calculate high scores and store to table
            const matches: MatchWithEventDetails[] = [];
            for (const _event of (events as EventSchedule[])) {
                const evt = order[events.indexOf(_event)];
                if (_event.Schedule[0]) {
                    for (const match of _event.Schedule) {
                        if (match.postResultTime && match.postResultTime !== '') {
                            // Result was posted, so the match has occurred
                            matches.push({
                                event: evt,
                                match: match
                            });
                        }
                    }
                } else {
                    console.log('Event', evt.eventCode, evt.type, 'has no schedule data, likely occurs in the future');
                }
            }
            const overallHighScorePlayoff: MatchWithEventDetails[] = [];
            const overallHighScoreQual: MatchWithEventDetails[] = [];
            const penaltyFreeHighScorePlayoff: MatchWithEventDetails[] = [];
            const penaltyFreeHighScoreQual: MatchWithEventDetails[] = [];
            const offsettingPenaltyHighScorePlayoff: MatchWithEventDetails[] = [];
            const offsettingPenaltyHighScoreQual: MatchWithEventDetails[] = [];
            for (const match of matches) {
                if (match.event.type === 'playoff') {
                    overallHighScorePlayoff.push(match);
                }
                if (match.event.type === 'qual') {
                    overallHighScoreQual.push(match);
                }
                if (match.event.type === 'playoff'
                    && match.match.scoreBlueFoul === 0 && match.match.scoreRedFoul === 0) {
                    penaltyFreeHighScorePlayoff.push(match);
                } else if (match.event.type === 'qual'
                    && match.match.scoreBlueFoul === 0 && match.match.scoreRedFoul === 0) {
                    penaltyFreeHighScoreQual.push(match);
                } else if (match.event.type === 'playoff'
                    && match.match.scoreBlueFoul === match.match.scoreRedFoul && match.match.scoreBlueFoul > 0) {
                    offsettingPenaltyHighScorePlayoff.push(match);
                } else if (match.event.type === 'qual'
                    && match.match.scoreBlueFoul === match.match.scoreRedFoul && match.match.scoreBlueFoul > 0) {
                    offsettingPenaltyHighScoreQual.push(match);
                }
            }
            StoreHighScore(process.env.FRC_CURRENT_SEASON, 'overall', 'playoff', FindHighestScore(overallHighScorePlayoff));
            StoreHighScore(process.env.FRC_CURRENT_SEASON, 'overall', 'qual', FindHighestScore(overallHighScoreQual));
            StoreHighScore(process.env.FRC_CURRENT_SEASON, 'penaltyFree', 'playoff', FindHighestScore(penaltyFreeHighScorePlayoff));
            StoreHighScore(process.env.FRC_CURRENT_SEASON, 'penaltyFree', 'qual', FindHighestScore(penaltyFreeHighScoreQual));
            StoreHighScore(process.env.FRC_CURRENT_SEASON, 'offsetting', 'playoff', FindHighestScore(offsettingPenaltyHighScorePlayoff));
            StoreHighScore(process.env.FRC_CURRENT_SEASON, 'offsetting', 'qual', FindHighestScore(offsettingPenaltyHighScoreQual));
            callback();
        });
    });
};

export { GetEvents, GetEventTeams, GetTeamAwards, GetEventScores, GetEventSchedule, UpdateHighScores, ServeUI, GetHighScores }

/**
 * Get and return data from the FIRST API
 * @param path The path on the FIRST API to call
 * @param callback The lambda callback to return the data
 */
function GetDataFromFIRSTAndReturn(path: string, callback: any) {
    return GetDataFromFIRST(path).then((body) => {
        ReturnJsonWithCode(200, body, callback);
    });
}

/**
 * Get data from FIRST and return a promise
 * @param path The path to GET data from
 */
function GetDataFromFIRST(path: string): Promise<any> {
    try {
        const options = {
            method: 'GET',
            uri: 'https://frc-api.firstinspires.org/v2.0/' + path,
            json: true,
            headers: {
                'Authorization': process.env.FRC_API_KEY,
                'Accept': 'application/json'
            }
        };
        return rp(options);
    } catch (err) {
        console.error(err);
        return Promise.reject(err);
    }
}

/**
 * Return JSON data to the user with a specific status code.
 * @param statusCode The status code to use in the return.
 * @param body The body data (JSON) to return
 * @param callback The lambda callback function
 */
function ReturnJsonWithCode(statusCode: number, body: any, callback: any) {
    return callback(null, {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'charset': 'utf-8'
        },
        isBase64Encoded: false
    });
}

/**
 * Store a high score in the database
 * @param year The year for this score
 * @param type The type for this score
 * @param level The competition level (qual or playoff)
 * @param match The match to store
 */
function StoreHighScore(year: string, type: string, level: string, match: MatchWithHighScoreDetails): Promise<any> {
    const params = {
        TableName: 'HighScoresTable',
        Item: {
            yearType: year + type + level,
            year: year,
            type: type,
            level: level,
            matchData: match
        }
    };
    return DynamoDB.put(params, (err, data) => {
        if (err) {
            console.log(err.message);
            return Promise.reject(err);
        } else {
            return Promise.resolve();
        }
    });
}

/**
 * Finds the highest score of a list of matches
 * @param matches Matches to find the highest score of
 */
function FindHighestScore(matches: MatchWithEventDetails[]): MatchWithHighScoreDetails {
    let highScore = 0;
    let alliance = '';
    let _match: MatchWithEventDetails;
    for (const match of matches) {
        if (match.match.scoreBlueFinal > highScore) {
            highScore = match.match.scoreBlueFinal;
            alliance = 'blue';
            _match = match;
        }
        if (match.match.scoreRedFinal > highScore) {
            highScore = match.match.scoreRedFinal;
            alliance = 'red';
            _match = match;
        }
    }
    return {
        event: _match.event,
        highScoreAlliance: alliance,
        match: _match.match
    };
}
