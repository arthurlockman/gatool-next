import {APIGatewayEvent, Callback, Context, CustomAuthorizerEvent, Handler} from 'aws-lambda';
import {MatchWithEventDetails} from './model/match';
import {EventAvatars, EventSchedule, EventType} from './model/event';
import {
    BuildHighScoreJson, GetAvatarData, GetDataFromFIRST,
    GetDataFromFIRSTAndReturn, ReturnJsonWithCode, ResponseWithHeaders,
    GetDataFromTBAAndReturn, CreateResponseJson, GetDataFromTBA
} from './utils/utils';
import {
    GetHighScoresFromDb,
    GetTeamUpdatesForTeam,
    StoreHighScore,
    StoreTeamUpdateForTeam,
} from './utils/databaseUtils';
import {FindHighestScore} from './utils/scoreUtils';
import {RetrieveUserPreferences, StoreUserPreferences} from './utils/s3StorageUtils';

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// noinspection JSUnusedGlobalSymbols
const GetEvents: Handler = (event: APIGatewayEvent) => {
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/events');
};

// noinspection JSUnusedGlobalSymbols
const GetTeams: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    if (event.queryStringParameters === null) {
        return ReturnJsonWithCode(400, 'You must supply query parameters.', callback);
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
    const initialTeamData = GetDataFromFIRST(`${event.pathParameters.year}/teams?${query.join('&')}&page=1`);
    initialTeamData.then(teamData => {
        if (teamData.body.statusCode) {
            return ReturnJsonWithCode(teamData.body.statusCode, teamData.body.message, callback);
        }
        if (teamData.body.pageTotal === 1) {
            return ReturnJsonWithCode(200, teamData.body, callback, teamData.headers);
        } else {
            const promises: Promise<any>[] = [];
            for (let i = 2; i <= teamData.body.pageTotal; i++) {
                promises.push(GetDataFromFIRST(`${event.pathParameters.year}/teams?${query.join('&')}&page=${i}`));
            }
            Promise.all(promises).then(allTeamData => {
                allTeamData.map(team => {
                    teamData.body.teamCountPage += team.body.teamCountPage;
                    teamData.body.teams = teamData.body.teams.concat(team.body.teams);
                });
                teamData.body.pageTotal = 1;
                return ReturnJsonWithCode(200, teamData.body, callback, teamData.headers);
            });
        }
    })
};

// noinspection JSUnusedGlobalSymbols
const GetDistrictRankings: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const query = [];
    query.push(`districtCode=${event.pathParameters.districtCode}`);
    if (event.queryStringParameters) {
        const top = event.queryStringParameters.top;
        if (top) {
            query.push(`top=${top}`);
        }
    }
    const initialRankingData = GetDataFromFIRST(`${event.pathParameters.year}/rankings/district?${query.join('&')}&page=1`);
    initialRankingData.then(rankingData => {
        if (rankingData.body.statusCode) {
            return ReturnJsonWithCode(rankingData.body.statusCode, rankingData.body.message, callback);
        }
        if (rankingData.body.pageTotal === 1) {
            return ReturnJsonWithCode(200, rankingData.body, callback, rankingData.headers);
        } else {
            const promises: Promise<any>[] = [];
            for (let i = 2; i <= rankingData.body.pageTotal; i++) {
                promises.push(GetDataFromFIRST(`${event.pathParameters.year}/rankings/district?${query.join('&')}&page=${i}`));
            }
            Promise.all(promises).then(allRankData => {
                allRankData.map(districtRank => {
                    rankingData.body.rankingCountPage += districtRank.body.rankingCountPage;
                    rankingData.body.districtRanks = rankingData.body.districtRanks.concat(districtRank.body.districtRanks);
                });
                rankingData.body.pageTotal = 1;
                return ReturnJsonWithCode(200, rankingData.body, callback, rankingData.headers);
            });
        }
    })
};

// noinspection JSUnusedGlobalSymbols
const GetEventTeams: Handler = (event: APIGatewayEvent) => {
    // TODO: remove pagination from this API
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/teams?eventcode='
        + event.pathParameters.eventCode + '&page=' + event.pathParameters.page);
};

// noinspection JSUnusedGlobalSymbols
const GetDistrictTeams: Handler = (event: APIGatewayEvent) => {
    // TODO: remove pagination from this API
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/teams?districtCode='
        + event.pathParameters.districtCode + '&page=' + event.pathParameters.page);
};

// noinspection JSUnusedGlobalSymbols
const GetTeamAwards: Handler = (event: APIGatewayEvent) => {
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/awards/' + event.pathParameters.teamNumber);
};

// noinspection JSUnusedGlobalSymbols
const GetHistoricTeamAwards: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const currentSeason = parseInt(process.env.FRC_CURRENT_SEASON, 10);
    GetDataFromFIRST(`${currentSeason}/awards/${event.pathParameters.teamNumber}`).then(currentYearAwards => {
        GetDataFromFIRST(`${currentSeason - 1}/awards/${event.pathParameters.teamNumber}`).then(pastYearAwards => {
            GetDataFromFIRST(`${currentSeason - 2}/awards/${event.pathParameters.teamNumber}`).then(secondYearAwards => {
                const awardList = {};
                awardList[`${currentSeason}`] = currentYearAwards.body;
                awardList[`${currentSeason - 1}`] = pastYearAwards.body;
                awardList[`${currentSeason - 2}`] = secondYearAwards.body;
                ReturnJsonWithCode(200, awardList, callback);
            }).catch(err => {
                const awardList = {};
                awardList[`${currentSeason}`] = currentYearAwards.body;
                awardList[`${currentSeason - 1}`] = pastYearAwards.body;
                ReturnJsonWithCode(200, awardList, callback);
            });
        }).catch(err => {
            const awardList = {};
            awardList[`${currentSeason}`] = currentYearAwards.body;
            ReturnJsonWithCode(200, awardList, callback);
        });
    }).catch(err => {
        ReturnJsonWithCode(err.statusCode, err.message, callback);
    });
};

// noinspection JSUnusedGlobalSymbols
const GetEventScores: Handler = (event: APIGatewayEvent) => {
    const range = (event.pathParameters.start === event.pathParameters.end) ?
        '?matchNumber=' + event.pathParameters.start :
        '?start=' + event.pathParameters.start + '&end=' + event.pathParameters.end;
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/scores/' +
        event.pathParameters.eventCode + '/' + event.pathParameters.tournamentLevel + range);
};

// noinspection JSUnusedGlobalSymbols
const GetEventSchedule: Handler = (event: APIGatewayEvent) => {
    return GetDataFromFIRSTAndReturn(event.pathParameters.year + '/schedule/' +
        event.pathParameters.eventCode + '/' + event.pathParameters.tournamentLevel + '/hybrid');
};

// noinspection JSUnusedGlobalSymbols
const GetHighScores: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetHighScoresFromDb().then(scores => {
        return CreateResponseJson(200, scores.Items.filter(x => x.year === event.pathParameters.year));
    });
};

// noinspection JSUnusedGlobalSymbols
const GetEventAlliances: Handler = (event: APIGatewayEvent) => {
    return GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/alliances/${event.pathParameters.eventCode}`);
};

// noinspection JSUnusedGlobalSymbols
const GetEventRankings: Handler = (event: APIGatewayEvent) => {
    return GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/rankings/${event.pathParameters.eventCode}`);
};

// noinspection JSUnusedGlobalSymbols
const GetEventAvatars: Handler = (event: APIGatewayEvent) => {
    const year = event.pathParameters.year;
    const eventCode = event.pathParameters.eventCode;
    const initialAvatarData = GetAvatarData(year, eventCode);
    return initialAvatarData.then(avatarList => {
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
            return Promise.all(promises).then(allAvatarData => {
                allAvatarData.map(avatar => {
                    avatarList.teamCountPage += avatar.teamCountPage;
                    avatarList.teams = avatarList.teams.concat(avatar.teams);
                });
                avatarList.pageTotal = 1;
                return CreateResponseJson(200, avatarList);
            });
        }
    });
};

// noinspection JSUnusedGlobalSymbols
const GetTeamAvatar: Handler = (event: APIGatewayEvent) => {
    const avatar = GetDataFromFIRST(
        `${event.pathParameters.year}/avatars?teamNumber=${event.pathParameters.teamNumber}`);
    return avatar.then(value => {
        const allAvatars = value.body as EventAvatars;
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
    }).catch(rejection => {
        const statusCode = rejection.response ? parseInt(rejection.statusCode, 10) : 404;
        const message = rejection.response ? rejection.response.body : 'Avatar not found.';
        return CreateResponseJson(statusCode, message);
    });
};

// noinspection JSUnusedGlobalSymbols
const GetEventHighScores: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetDataFromFIRST(`${event.pathParameters.year}/events/`).then( (eventList) => {
        const evtList = eventList.body.Events.filter(evt => evt.code === event.pathParameters.eventCode);
        if (evtList.length !== 1) {
            return ReturnJsonWithCode(404, 'Event not found.', callback);
        }
        const eventDetails = evtList[0];
        return GetDataFromFIRST(`${event.pathParameters.year}/schedule/${event.pathParameters.eventCode}/qual/hybrid`)
            .then((qualMatchList) => {
                return GetDataFromFIRST(`${event.pathParameters.year}/schedule/${event.pathParameters.eventCode}/playoff/hybrid`)
                    .then((playoffMatchList) => {
                        let matches: MatchWithEventDetails[] = qualMatchList.body.Schedule
                            .map(x => {return {event: {eventCode: eventDetails.code, type: 'qual'}, match: x}})
                                .concat(playoffMatchList.body.Schedule
                                    .map(x => {return {event: {eventCode: eventDetails.code, type: 'playoff'}, match: x}}));
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
                        return ReturnJsonWithCode(200, highScoresData, callback);
                    }).catch(rejection => {
                        const statusCode = rejection.response ? parseInt(rejection.response.statusCode, 10) : 400;
                        const message = rejection.response ? rejection.response.body : 'Bad request.';
                        return ReturnJsonWithCode(statusCode, message, callback);
                    });
            }).catch(rejection => {
                const statusCode = rejection.response ? parseInt(rejection.response.statusCode, 10) : 400;
                const message = rejection.response ? rejection.response.body : 'Bad request.';
                return ReturnJsonWithCode(statusCode, message, callback);
            });
    });
};

// noinspection JSUnusedGlobalSymbols
const GetTeamAppearances: Handler = (event: APIGatewayEvent) => {
    return GetDataFromTBAAndReturn(`team/frc${event.pathParameters.teamNumber}/events`);
};

// noinspection JSUnusedGlobalSymbols
const GetAllTeamAwards: Handler = (event: APIGatewayEvent) => {
    return GetDataFromTBAAndReturn(`team/frc${event.pathParameters.teamNumber}/awards`);
};

// noinspection JSUnusedGlobalSymbols
const GetOffseasonEvents: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetDataFromTBA(`events/${event.pathParameters.year}`).then(response => {
        const events = response.body;
        const result = [];
        const output = {};
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
    }).catch(rejection => {
        if (!!rejection.message && rejection.message.includes('TIMEDOUT')) {
            return CreateResponseJson(504, 'Timed Out');
        }
        return CreateResponseJson(parseInt(rejection.statusCode, 10), rejection.response.body);
    });
};

// noinspection JSUnusedGlobalSymbols
const GetOffseasonTeams: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetDataFromTBA(`event/${event.pathParameters.eventCode}/teams`).then(response => {
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
    }).catch(rejection => {
        if (!!rejection.message && rejection.message.includes('TIMEDOUT')) {
            return CreateResponseJson(504, 'Timed Out');
        }
        return CreateResponseJson(parseInt(rejection.statusCode, 10), rejection.response.body);
    });
};

// noinspection JSUnusedGlobalSymbols
const GetTeamUpdates: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetTeamUpdatesForTeam(event.pathParameters.teamNumber).then(updateData => {
        return ReturnJsonWithCode(200, JSON.parse(updateData.Item.data), callback);
    }).catch(err => {
        return ReturnJsonWithCode(204, null, callback); // no update data found
    });
};

// noinspection JSUnusedGlobalSymbols
const PutTeamUpdates: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return StoreTeamUpdateForTeam(event.pathParameters.teamNumber, JSON.parse(event.body)).then(_ => {
        return ReturnJsonWithCode(200, `Update stored for team ${event.pathParameters.teamNumber}`, callback);
    }).catch(err => {
        return ReturnJsonWithCode(500,
            `Error storing team update for team ${event.pathParameters.teamNumber}: ${err.message}`, callback);
    });
};

// noinspection JSUnusedGlobalSymbols
const GetUserPreferences: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const token = event.headers['Authorization'];
    const decoded = jwt.decode(token.replace('Bearer ', ''), { complete: true });
    if (decoded !== null && decoded.payload.email !== null) {
        const userName: string = decoded.payload.email;
        return RetrieveUserPreferences(userName).then(preferences => {
            return ReturnJsonWithCode(200, JSON.parse(preferences.Body.toString('utf-8')), callback);
        }).catch(err => {
            return ReturnJsonWithCode(204, null, callback); // no preference data found
        });
    }
    return ReturnJsonWithCode(400, 'Unable to decode user from token.', callback);
};

// noinspection JSUnusedGlobalSymbols
const PutUserPreferences: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const token = event.headers['Authorization'];
    const decoded = jwt.decode(token.replace('Bearer ', ''), { complete: true });
    if (decoded !== null && decoded.payload.email !== null) {
        const userName: string = decoded.payload.email;
        return StoreUserPreferences(userName, JSON.parse(event.body)).then(_ => {
            return ReturnJsonWithCode(200, `Preferences stored for ${userName}`, callback);
        }).catch(err => {
            return ReturnJsonWithCode(500,
                `Error storing preferences for user ${userName}: ${err.message}`, callback);
        });
    }
    return ReturnJsonWithCode(400, 'Unable to decode user from token.', callback);
};

// noinspection JSUnusedGlobalSymbols
const UpdateHighScores: Handler = (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return GetDataFromFIRST(process.env.FRC_CURRENT_SEASON + '/events').then((eventList) => {
        const promises: Promise<ResponseWithHeaders>[] = [];
        const order: EventType[] = [];
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 1);
        for (const _event of eventList.body.Events) {
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
        return Promise.all(promises).then((events) => {
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
            return Promise.all(highScorePromises).then(() => {
                callback();
            }, (err) => {
                console.error(err);
                callback(err);
            });
        }).catch(err => {
            console.error(err);
            callback(err);
        });
    });
};

// noinspection JSUnusedGlobalSymbols
/**
 * Authorizer functions are executed before your actual functions.
 * @method authorize
 * @param {String} event.authorizationToken - JWT
 * @throws Returns 401 if the token is invalid or has expired.
 */
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
                });
            });
        });
    } catch (e) {
        callback('Unauthorized'); // Return a 401 Unauthorized response
    }
};

// noinspection JSUnusedGlobalSymbols
export {GetEvents, GetEventTeams, GetTeamAwards, GetEventScores, GetEventSchedule, GetEventAvatars,
    UpdateHighScores, GetHighScores, GetOffseasonEvents, GetEventAlliances, GetEventRankings,
    Authorize, GetTeamAvatar, GetEventHighScores, GetTeamUpdates, PutTeamUpdates, GetUserPreferences,
    PutUserPreferences, GetHistoricTeamAwards, GetDistrictTeams, GetTeams, GetDistrictRankings,
    GetTeamAppearances, GetAllTeamAwards, GetOffseasonTeams}

// Handle unexpected application errors
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
