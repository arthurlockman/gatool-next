import {APIGatewayEvent, Callback, Context, CustomAuthorizerEvent, Handler} from 'aws-lambda';
import {MatchWithEventDetails} from './model/match';
import {EventSchedule, EventType} from './model/event';
import {GetDataFromFIRST, GetDataFromFIRSTAndReturn, ReturnJsonWithCode} from './utils/utils';
import {GetHighScoresFromDb, StoreHighScore} from './utils/databaseUtils';
import {FindHighestScore} from './utils/scoreUtils';
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// noinspection JSUnusedGlobalSymbols
const GetEvents: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/events', callback);
};

// noinspection JSUnusedGlobalSymbols
const GetEventTeams: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    // TODO: remove pagination from this API
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/teams?eventcode='
        + event.pathParameters.eventCode + '&page=' + event.pathParameters.page, callback);
};

// noinspection JSUnusedGlobalSymbols
const GetTeamAwards: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/awards/' + event.pathParameters.teamNumber, callback);
};

// noinspection JSUnusedGlobalSymbols
const GetEventScores: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const range = (event.pathParameters.start === event.pathParameters.end) ?
        '?matchNumber=' + event.pathParameters.start :
        '?start=' + event.pathParameters.start + '&end=' + event.pathParameters.end;
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/scores/' +
        event.pathParameters.eventCode + '/' + event.pathParameters.tournamentLevel + range, callback);
};

// noinspection JSUnusedGlobalSymbols
const GetEventSchedule: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/schedule/' +
        event.pathParameters.eventCode + '/' + event.pathParameters.tournamentLevel + '/hybrid', callback);
};

// noinspection JSUnusedGlobalSymbols
const GetHighScores: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetHighScoresFromDb().then(scores => {
        ReturnJsonWithCode(200, scores.Items.filter(x => x.year === event.pathParameters.year), callback);
    });
};

// noinspection JSUnusedGlobalSymbols
const GetEventAlliances: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/alliances/${event.pathParameters.eventCode}`, callback);
};

// noinspection JSUnusedGlobalSymbols
const GetEventRankings: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/rankings/${event.pathParameters.eventCode}`, callback);
};

// noinspection JSUnusedGlobalSymbols
const GetOffseasonEvents: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    // TODO: implement this stub
};

// noinspection JSUnusedGlobalSymbols
const UpdateHighScores: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
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
            const highScorePromises = [];
            highScorePromises.push(StoreHighScore(process.env.FRC_CURRENT_SEASON, 'overall', 'playoff',
                FindHighestScore(overallHighScorePlayoff)));
            highScorePromises.push(StoreHighScore(process.env.FRC_CURRENT_SEASON, 'overall', 'qual',
                FindHighestScore(overallHighScoreQual)));
            highScorePromises.push(StoreHighScore(process.env.FRC_CURRENT_SEASON, 'penaltyFree', 'playoff',
                FindHighestScore(penaltyFreeHighScorePlayoff)));
            highScorePromises.push(StoreHighScore(process.env.FRC_CURRENT_SEASON, 'penaltyFree', 'qual',
                FindHighestScore(penaltyFreeHighScoreQual)));
            highScorePromises.push(StoreHighScore(process.env.FRC_CURRENT_SEASON, 'offsetting', 'playoff',
                FindHighestScore(offsettingPenaltyHighScorePlayoff)));
            highScorePromises.push(StoreHighScore(process.env.FRC_CURRENT_SEASON, 'offsetting', 'qual',
                FindHighestScore(offsettingPenaltyHighScoreQual)));
            Promise.all(highScorePromises).then(() => {
                callback();
            }, (err) => {
                console.error(err);
                callback(err);
            });
        });
    });
};

/**
 * Authorizer functions are executed before your actual functions.
 * @method authorize
 * @param {String} event.authorizationToken - JWT
 * @throws Returns 401 if the token is invalid or has expired.
 */
// noinspection JSUnusedGlobalSymbols
const Authorize: Handler = (event: CustomAuthorizerEvent, context: Context, callback: Callback) => {
    const token = event.authorizationToken;
    try {
        // Verify using getKey callback
        // Example uses https://github.com/auth0/node-jwks-rsa as a way to fetch the keys.
        const decoded = jwt.decode(token.replace('Bearer ', ''), { complete: true });
        if (decoded === null) {
            callback('Unauthorized.');
        }
        const client = jwksClient({
            jwksUri: 'https://gatool.auth0.com/.well-known/jwks.json'
        });
        client.getSigningKey(decoded.header.kid, function(e, key) {
            if (e) {
                callback('Unauthorized.');
            }
            const signingKey = key.publicKey || key.rsaPublicKey;
            const options = { audience: 'afsE1dlAGS609U32NjmvNMaYSQmtO3NT', issuer: 'https://gatool.auth0.com/' };
            jwt.verify(token, signingKey, options, function(err, validToken) {
                callback(null, {
                    principalId: decoded.sub,
                    policyDocument: {
                        Version: '2012-10-17', // default version
                        Statement: [{
                            Action: 'execute-api:Invoke', // default action
                            Effect: 'Allow',
                            Resource: '*',
                        }]
                    },
                    context: { scope: decoded.scope }
                });
            });
        });
    } catch (e) {
        callback('Unauthorized'); // Return a 401 Unauthorized response
    }
};

// noinspection JSUnusedGlobalSymbols
export {GetEvents, GetEventTeams, GetTeamAwards, GetEventScores, GetEventSchedule,
    UpdateHighScores, GetHighScores, GetOffseasonEvents, GetEventAlliances, GetEventRankings,
    Authorize}

// Handle unexpected application errors
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
