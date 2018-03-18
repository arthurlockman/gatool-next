import { Handler, Context, Callback } from 'aws-lambda';
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
    // TODO: implement this stub
};

const GetOffseasonEvents: Handler = (event: any, context: Context, callback: Callback) => {
    // TODO: implement this stub
};

const UpdateHighScores: Handler = (event: any, context: Context, callback: Callback) => {
    return GetDataFromFIRST(process.env.FRC_CURRENT_SEASON + '/events').then((eventList) => {
        const promises = [];
        const order = [];
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
        Promise.all(promises).then((data) => {
            // TODO: calculate high scores and store to table
            // Qual (no fouls), Playoff (no fouls)
            // Qual (offsetting fouls), Playoff (offsetting fouls)
            // Qual, Playoff
            for (const match of data) {
                const eventCode = order[data.indexOf(match)].eventCode;
                const type = order[data.indexOf(match)].type;
                if (match.Schedule[0] && match.Schedule[0].actualStartTime) {
                    // Process score since it's a real score, store to table
                } else {
                    console.log('Event', eventCode, type, 'has no schedule data, likely occurs in the future');
                }
            }
            callback();
        });
    });
};

export { GetEvents, GetEventTeams, GetTeamAwards, GetEventScores, GetEventSchedule, UpdateHighScores, ServeUI }

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
 * @param score The match score
 * @param matchNumber The match number
 * @param eventCode The event code
 * @param eventName The event name
 * @param year The year for the score
 * @param type The type (qual, playoff) for the score
 * @param fouls The foul type (none, offsetting, included)
 */
function StoreHighScore(score: string, matchNumber: string, eventCode: string,
    eventName: string, year: string, type: string, fouls: string): Promise<any> {
    const params = {
        TableName: process.env.HIGH_SCORES_TABLE_NAME,
        Item: {
            yearType: year + type + fouls,
            year: year,
            type: type,
            fouls: fouls,
            eventCode: eventCode,
            eventName: eventName,
            matchNumber: matchNumber
        }
    };
    return DynamoDB.put(params, (err, data) => {
        if (err) {
            return Promise.reject(err);
        } else {
            return Promise.resolve();
        }
    });
}
