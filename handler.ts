import { APIGatewayEvent, APIGatewayTokenAuthorizerEvent, Callback, Context, CustomAuthorizerEvent, Handler } from 'aws-lambda';
import { MatchWithEventDetails } from './model/match';
import { EventAvatars, EventSchedule, EventType } from './model/event';
import {
    BuildHighScoreJson, GetAvatarData, GetDataFromFIRST,
    GetDataFromFIRSTAndReturn, GetDataFromFIRSTAndReturnV3, ReturnJsonWithCode, ResponseWithHeaders,
    GetDataFromTBAAndReturn, CreateResponseJson, GetDataFromTBA
} from './utils/utils';
import {
    GetHighScoresFromDb,
    GetTeamUpdatesForTeam,
    StoreHighScore,
    StoreTeamUpdateForTeam,
} from './utils/databaseUtils';
import { FindHighestScore } from './utils/scoreUtils';
import { RetrieveUserPreferences, StoreUserPreferences } from './utils/s3StorageUtils';

import jwt = require('jsonwebtoken');
import jwksClient = require('jwks-rsa');

// noinspection JSUnusedGlobalSymbols
const GetEvents: Handler = (event: APIGatewayEvent) => {
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/events');
};

// noinspection JSUnusedGlobalSymbols
const GetTeams: Handler = async (event: APIGatewayEvent) => {
    if (event.queryStringParameters === null) {
        return ReturnJsonWithCode(400, 'You must supply query parameters.');
    }
    const eventCode = event.queryStringParameters.eventCode;
    const districtCode = event.queryStringParameters.districtCode;
    const teamNumber = event.queryStringParameters.teamNumber;
    const query = [];
    if (eventCode) {
        query.push(`eventCode=${eventCode}`);
    }
    if (districtCode) {
        query.push(`districtCode=${districtCode}`);
    }
    if (teamNumber) {
        query.push(`teamNumber=${teamNumber}`);
    }
    const teamData = await GetDataFromFIRST(`${event.pathParameters.year}/teams?${query.join('&')}&page=1`);
    if (teamData.body.statusCode) {
        return ReturnJsonWithCode(teamData.body.statusCode, teamData.body.message);
    }
    if (teamData.body.pageTotal === 1) {
        return ReturnJsonWithCode(200, teamData.body, teamData.headers);
    } else {
        const promises: Promise<any>[] = [];
        for (let i = 2; i <= teamData.body.pageTotal; i++) {
            promises.push(GetDataFromFIRST(`${event.pathParameters.year}/teams?${query.join('&')}&page=${i}`));
        }
        const allTeamData = await Promise.all(promises);
        allTeamData.map(team => {
            teamData.body.teamCountPage += team.body.teamCountPage;
            teamData.body.teams = teamData.body.teams.concat(team.body.teams);
        });
        teamData.body.pageTotal = 1;
        return ReturnJsonWithCode(200, teamData.body, teamData.headers);
    }
};

// noinspection JSUnusedGlobalSymbols
const GetDistrictRankings: Handler = async (event: APIGatewayEvent) => {
    const query = [];
    query.push(`districtCode=${event.pathParameters.districtCode}`);
    if (event.queryStringParameters) {
        const top = event.queryStringParameters.top;
        if (top) {
            query.push(`top=${top}`);
        }
    }
    const rankingData = await GetDataFromFIRST(`${event.pathParameters.year}/rankings/district?${query.join('&')}&page=1`);
    if (rankingData.body.statusCode) {
        return ReturnJsonWithCode(rankingData.body.statusCode, rankingData.body.message);
    }
    if (rankingData.body.pageTotal === 1) {
        return ReturnJsonWithCode(200, rankingData.body, rankingData.headers);
    } else {
        const promises: Promise<any>[] = [];
        for (let i = 2; i <= rankingData.body.pageTotal; i++) {
            promises.push(GetDataFromFIRST(`${event.pathParameters.year}/rankings/district?${query.join('&')}&page=${i}`));
        }
        const allRankData = await Promise.all(promises);
        allRankData.map(districtRank => {
            rankingData.body.rankingCountPage += districtRank.body.rankingCountPage;
            rankingData.body.districtRanks = rankingData.body.districtRanks.concat(districtRank.body.districtRanks);
        });
        rankingData.body.pageTotal = 1;
        return ReturnJsonWithCode(200, rankingData.body, rankingData.headers);
    }
};

// noinspection JSUnusedGlobalSymbols
const GetEventTeams: Handler = async (event: APIGatewayEvent) => {
    // TODO: remove pagination from this API
    return await GetDataFromFIRSTAndReturn(event.pathParameters.year + '/teams?eventcode='
        + event.pathParameters.eventCode + '&page=' + event.pathParameters.page);
};

// noinspection JSUnusedGlobalSymbols
const GetDistrictTeams: Handler = async (event: APIGatewayEvent) => {
    // TODO: remove pagination from this API
    return await GetDataFromFIRSTAndReturn(event.pathParameters.year + '/teams?districtCode='
        + event.pathParameters.districtCode + '&page=' + event.pathParameters.page);
};

// noinspection JSUnusedGlobalSymbols
const GetTeamAwards: Handler = async (event: APIGatewayEvent) => {
    return await GetDataFromFIRSTAndReturn(event.pathParameters.year + '/awards/' + event.pathParameters.teamNumber);
};

// noinspection JSUnusedGlobalSymbols
const GetEventAwards: Handler = async (event: APIGatewayEvent) => {
    return await GetDataFromFIRSTAndReturnV3(event.pathParameters.year + '/awards/event/' + event.pathParameters.eventCode);
};

// noinspection JSUnusedGlobalSymbols
const GetHistoricTeamAwards: Handler = async (event: APIGatewayEvent) => {
    const currentSeason = parseInt(process.env.FRC_CURRENT_SEASON, 10);
    let currentYearAwards: ResponseWithHeaders | null, pastYearAwards: ResponseWithHeaders | null,
        secondYearAwards: ResponseWithHeaders | null;
    try {
        currentYearAwards = await GetDataFromFIRST(`${currentSeason}/awards/${event.pathParameters.teamNumber}`);
    } catch (_) {
        currentYearAwards = null;
    }
    try {
        pastYearAwards = await GetDataFromFIRST(`${currentSeason - 1}/awards/${event.pathParameters.teamNumber}`);
    } catch (_) {
        pastYearAwards = null;
    }
    try {
        secondYearAwards = await GetDataFromFIRST(`${currentSeason - 2}/awards/${event.pathParameters.teamNumber}`);
    } catch (_) {
        secondYearAwards = null;
    }
    const awardList = {};
    awardList[`${currentSeason}`] = currentYearAwards.body;
    awardList[`${currentSeason - 1}`] = pastYearAwards.body;
    awardList[`${currentSeason - 2}`] = secondYearAwards.body;
    return ReturnJsonWithCode(200, awardList);
};

// noinspection JSUnusedGlobalSymbols
const GetEventScores: Handler = async (event: APIGatewayEvent) => {
    const range = (event.pathParameters.start === event.pathParameters.end) ?
        '?matchNumber=' + event.pathParameters.start :
        '?start=' + event.pathParameters.start + '&end=' + event.pathParameters.end;
    return await GetDataFromFIRSTAndReturn(event.pathParameters.year + '/scores/' +
        event.pathParameters.eventCode + '/' + event.pathParameters.tournamentLevel + range);
};

// noinspection JSUnusedGlobalSymbols
const GetEventSchedule: Handler = async (event: APIGatewayEvent) => {
    return await GetDataFromFIRSTAndReturn(event.pathParameters.year + '/schedule/' +
        event.pathParameters.eventCode + '/' + event.pathParameters.tournamentLevel + '/hybrid');
};

// noinspection JSUnusedGlobalSymbols
const GetHighScores: Handler = async (event: APIGatewayEvent) => {
    const scores = await GetHighScoresFromDb();
    return CreateResponseJson(200, scores.Items.filter(x => x.year === event.pathParameters.year));
};

// noinspection JSUnusedGlobalSymbols
const GetEventAlliances: Handler = async (event: APIGatewayEvent) => {
    return await GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/alliances/${event.pathParameters.eventCode}`);
};

// noinspection JSUnusedGlobalSymbols
const GetEventRankings: Handler = async (event: APIGatewayEvent) => {
    return await GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/rankings/${event.pathParameters.eventCode}`);
};

// noinspection JSUnusedGlobalSymbols
const GetEventAvatars: Handler = async (event: APIGatewayEvent) => {
    const year = event.pathParameters.year;
    const eventCode = event.pathParameters.eventCode;
    const avatarList = await GetAvatarData(year, eventCode);
    if (avatarList.body && avatarList.body.statusCode) {
        return CreateResponseJson(avatarList.body.statusCode, avatarList.body.message);
    }
    if (avatarList.pageTotal === 1) {
        return CreateResponseJson(200, avatarList);
    } else {
        const promises: Promise<EventAvatars>[] = [];
        for (let i = 2; i <= avatarList.pageTotal; i++) {
            promises.push(GetAvatarData(year, eventCode, i));
        }
        const allAvatarData = await Promise.all(promises);
        allAvatarData.map(avatar => {
            avatarList.teamCountPage += avatar.teamCountPage;
            avatarList.teams = avatarList.teams.concat(avatar.teams);
        });
        avatarList.pageTotal = 1;
        return CreateResponseJson(200, avatarList);
    }
};

// noinspection JSUnusedGlobalSymbols
const GetTeamAvatar: Handler = async (event: APIGatewayEvent) => {
    try {
        const avatar = await GetDataFromFIRST(
            `${event.pathParameters.year}/avatars?teamNumber=${event.pathParameters.teamNumber}`);
        const allAvatars = avatar.body as EventAvatars;
        const teamAvatar = allAvatars.teams[0];
        if (teamAvatar.encodedAvatar == null) {
            throw new Error('Bad request');
        }
        return {
            statusCode: 200,
            body: teamAvatar.encodedAvatar,
            headers: {
                'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
                'Content-Type': 'image/png',
                'charset': 'utf-8'
            },
            isBase64Encoded: true
        };
    } catch (rejection) {
        const statusCode = rejection.response ? parseInt(rejection.statusCode, 10) : 404;
        const message = rejection.response ? rejection.response.body : 'Avatar not found.';
        return CreateResponseJson(statusCode, message);
    };
};

// noinspection JSUnusedGlobalSymbols
const GetEventHighScores: Handler = async (event: APIGatewayEvent) => {
    const eventList = await GetDataFromFIRST(`${event.pathParameters.year}/events/`);
    const evtList = eventList.body.Events.filter(evt => evt.code === event.pathParameters.eventCode);
    if (evtList.length !== 1) {
        return ReturnJsonWithCode(404, 'Event not found.');
    }
    const eventDetails = evtList[0];
    const qualMatchList = await GetDataFromFIRST(`${event.pathParameters.year}/schedule/${event.pathParameters.eventCode}/qual/hybrid`);
    const playoffMatchList =
        await GetDataFromFIRST(`${event.pathParameters.year}/schedule/${event.pathParameters.eventCode}/playoff/hybrid`);

    let matches: MatchWithEventDetails[] = qualMatchList.body.Schedule
        .map(x => { return { event: { eventCode: eventDetails.code, type: 'qual' }, match: x } })
        .concat(playoffMatchList.body.Schedule
            .map(x => { return { event: { eventCode: eventDetails.code, type: 'playoff' }, match: x } }));
    matches = matches.filter(match => match.match.postResultTime && match.match.postResultTime !== '');
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
    const highScoresData = [];
    if (overallHighScorePlayoff.length > 0) {
        highScoresData.push(BuildHighScoreJson(event.pathParameters.year, 'overall', 'playoff',
            FindHighestScore(overallHighScorePlayoff)));
    }
    if (overallHighScoreQual.length > 0) {
        highScoresData.push(BuildHighScoreJson(event.pathParameters.year, 'overall', 'qual',
            FindHighestScore(overallHighScoreQual)));
    }
    if (penaltyFreeHighScorePlayoff.length > 0) {
        highScoresData.push(BuildHighScoreJson(event.pathParameters.year, 'penaltyFree', 'playoff',
            FindHighestScore(penaltyFreeHighScorePlayoff)));
    }
    if (penaltyFreeHighScoreQual.length > 0) {
        highScoresData.push(BuildHighScoreJson(event.pathParameters.year, 'penaltyFree', 'qual',
            FindHighestScore(penaltyFreeHighScoreQual)));
    }
    if (offsettingPenaltyHighScorePlayoff.length > 0) {
        highScoresData.push(BuildHighScoreJson(event.pathParameters.year, 'offsetting', 'playoff',
            FindHighestScore(offsettingPenaltyHighScorePlayoff)));
    }
    if (offsettingPenaltyHighScoreQual.length > 0) {
        highScoresData.push(BuildHighScoreJson(event.pathParameters.year, 'offsetting', 'qual',
            FindHighestScore(offsettingPenaltyHighScoreQual)));
    }
    return ReturnJsonWithCode(200, highScoresData);

};

// noinspection JSUnusedGlobalSymbols
const GetTeamAppearances: Handler = async (event: APIGatewayEvent) => {
    return await GetDataFromTBAAndReturn(`team/frc${event.pathParameters.teamNumber}/events`);
};

// noinspection JSUnusedGlobalSymbols
const GetAllTeamAwards: Handler = async (event: APIGatewayEvent) => {
    return await GetDataFromTBAAndReturn(`team/frc${event.pathParameters.teamNumber}/awards`);
};

// noinspection JSUnusedGlobalSymbols
const GetOffseasonEvents: Handler = async (event: APIGatewayEvent) => {
    try {
        const response = await GetDataFromTBA(`events/${event.pathParameters.year}`);
        const events = response.body;
        const result = [];
        for (let i = 1; i < events.length; i++) {
            try {
                if (events[i].event_type_string === 'Offseason') {
                    let address = 'no address, no city, no state, no country';
                    if (!!events[i].address) {
                        address = events[i].address;
                    }
                    const tmp = {
                        'code': events[i].key,
                        'divisionCode': events[i].event_code,
                        'name': events[i].short_name,
                        'type': events[i].event_type_string,
                        'districtCode': events[i].event_district_string,
                        'venue': events[i].location_name,
                        'address': address.split(', ')[0],
                        'city': address.split(', ')[1],
                        'stateprov': address.split(', ')[2],
                        'country': address.split(', ')[3],
                        'website': events[i].website,
                        'timezone': events[i].timezone,
                        'dateStart': events[i].start_date,
                        'dateEnd': events[i].end_date
                    };
                    result.push(tmp);
                }
            } catch (ex) {
                console.error(`Error parsing event data: ${JSON.stringify(events[i])}`);
            }
        }
        return CreateResponseJson(200, {
            'Events': result,
            'eventCount': result.length
        });
    } catch (rejection) {
        if (!!rejection.message && rejection.message.includes('TIMEDOUT')) {
            return CreateResponseJson(504, 'Timed Out');
        }
        return CreateResponseJson(parseInt(rejection.statusCode, 10), rejection.response.body);
    }
};

// noinspection JSUnusedGlobalSymbols
const GetOffseasonTeams: Handler = async (event: APIGatewayEvent) => {
    try {
        const response = await GetDataFromTBA(`event/${event.pathParameters.eventCode}/teams`);
        const teams = response.body;
        teams.sort(function (a, b) {
            return parseInt(a.team_number, 10) - parseInt(b.team_number, 10);
        });
        const result = [];
        for (let i = 1; i < teams.length; i++) {
            try {
                const tmp = {
                    'teamNumber': teams[i].team_number,
                    'nameFull': teams[i].name,
                    'nameShort': teams[i].nickname,
                    'schoolName': null,
                    'city': teams[i].city,
                    'stateProv': teams[i].state_prov,
                    'country': teams[i].country,
                    'website': teams[i].website,
                    'rookieYear': teams[i].rookie_year,
                    'robotName': null,
                    'districtCode': null,
                    'homeCMP': null
                };
                result.push(tmp);
            } catch (ex) {
                console.error(`Error parsing event data: ${JSON.stringify(teams[i])}`);
            }
        }
        return CreateResponseJson(200, {
            'teams': result,
            'teamCountTotal': result.length,
            'teamCountPage': result.length,
            'pageCurrent': 1,
            'pageTotal': 1
        });
    } catch (rejection) {
        if (!!rejection.message && rejection.message.includes('TIMEDOUT')) {
            return CreateResponseJson(504, 'Timed Out');
        }
        return CreateResponseJson(parseInt(rejection.statusCode, 10), rejection.response.body);
    }
};

// noinspection JSUnusedGlobalSymbols
const GetTeamUpdates: Handler = async (event: APIGatewayEvent) => {
    try {
        const updateData = await GetTeamUpdatesForTeam(event.pathParameters.teamNumber);
        return ReturnJsonWithCode(200, JSON.parse(updateData.Item.data));
    } catch (e) {
        return ReturnJsonWithCode(204, null); // no update data found
    }
};

// noinspection JSUnusedGlobalSymbols
const PutTeamUpdates: Handler = async (event: APIGatewayEvent) => {
    await StoreTeamUpdateForTeam(event.pathParameters.teamNumber, JSON.parse(event.body));
    return ReturnJsonWithCode(200, `Update stored for team ${event.pathParameters.teamNumber}`);
};

// noinspection JSUnusedGlobalSymbols
const GetUserPreferences: Handler = async (event: APIGatewayEvent) => {
    const token = event.headers['Authorization'];
    const decoded = jwt.decode(token.replace('Bearer ', ''), { complete: true });
    if (decoded !== null && decoded.payload.email !== null) {
        try {
            const userName: string = decoded.payload.email;
            const preferences = await RetrieveUserPreferences(userName);
            return ReturnJsonWithCode(200, JSON.parse(preferences.Body.toString('utf-8')));
        } catch (e) {
            return ReturnJsonWithCode(204, null); // no preference data found
        }
    }
    return ReturnJsonWithCode(400, 'Unable to decode user from token.');
};

// noinspection JSUnusedGlobalSymbols
const PutUserPreferences: Handler = async (event: APIGatewayEvent) => {
    const token = event.headers['Authorization'];
    const decoded = jwt.decode(token.replace('Bearer ', ''), { complete: true });
    if (decoded !== null && decoded.payload.email !== null) {
        const userName: string = decoded.payload.email;
        await StoreUserPreferences(userName, JSON.parse(event.body));
        return ReturnJsonWithCode(200, `Preferences stored for ${userName}`);
    }
    return ReturnJsonWithCode(400, 'Unable to decode user from token.');
};

// TODO: make async
// noinspection JSUnusedGlobalSymbols
const UpdateHighScores: Handler = async () => {
    const eventList = await GetDataFromFIRST(process.env.FRC_CURRENT_SEASON + '/events');
    const promises: Promise<ResponseWithHeaders>[] = [];
    const order: EventType[] = [];
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    for (const _event of eventList.body.Events) {
        const eventDate = new Date(_event.dateStart);
        if (eventDate < currentDate) {
            promises.push(GetDataFromFIRST(process.env.FRC_CURRENT_SEASON + '/schedule/' + _event.code + '/qual/hybrid').catch(_ => {
                return {
                    body: {
                        Schedule: []
                    }
                } as ResponseWithHeaders;
            }));
            promises.push(GetDataFromFIRST(process.env.FRC_CURRENT_SEASON + '/schedule/' + _event.code + '/playoff/hybrid').catch(_ => {
                return {
                    body: {
                        Schedule: []
                    }
                } as ResponseWithHeaders;
            }));
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
    const events = await Promise.all(promises);
    const matches: MatchWithEventDetails[] = [];
    const eventBody = events.map(e => e.body) as EventSchedule[];
    for (const _event of eventBody) {
        const evt = order[eventBody.indexOf(_event)];
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
    return await Promise.all(highScorePromises);
};

// noinspection JSUnusedGlobalSymbols
/**
 * Authorizer functions are executed before your actual functions.
 * @method authorize
 * @param {String} event.authorizationToken - JWT
 * @throws Returns 401 if the token is invalid or has expired.
 */
const Authorize: Handler = async (event: APIGatewayTokenAuthorizerEvent) => {
    const token = event.authorizationToken;
    // Verify using getKey callback
    // Example uses https://github.com/auth0/node-jwks-rsa as a way to fetch the keys.
    const decoded = jwt.decode(token.replace('Bearer ', ''), { complete: true });
    if (decoded === null) {
        throw new Error('Unauthorized.');
    }
    const client = jwksClient({
        jwksUri: 'https://gatool.auth0.com/.well-known/jwks.json'
    });
    const signingKey = await client.getSigningKey(decoded.header.kid);
    const options = { audience: 'afsE1dlAGS609U32NjmvNMaYSQmtO3NT', issuer: 'https://gatool.auth0.com/' };
    const verifiedToken = jwt.verify(token.replace('Bearer ', ''), signingKey.getPublicKey(), options);
    if (verifiedToken) {
        return {
            principalId: decoded.payload.sub,
            policyDocument: {
                Version: '2012-10-17', // default version
                Statement: [{
                    Action: 'execute-api:Invoke', // default action
                    Effect: 'Allow',
                    Resource: '*',
                }]
            },
            context: { scope: decoded.payload.scope }
        };
    } else {
        throw new Error('Unauthorized.');
    }
};

// noinspection JSUnusedGlobalSymbols
export {
    GetEvents, GetEventTeams, GetTeamAwards, GetEventScores, GetEventSchedule, GetEventAvatars,
    UpdateHighScores, GetHighScores, GetOffseasonEvents, GetEventAlliances, GetEventRankings,
    Authorize, GetTeamAvatar, GetEventHighScores, GetTeamUpdates, PutTeamUpdates, GetUserPreferences,
    PutUserPreferences, GetHistoricTeamAwards, GetDistrictTeams, GetTeams, GetDistrictRankings,
    GetTeamAppearances, GetAllTeamAwards, GetOffseasonTeams, GetEventAwards
}
