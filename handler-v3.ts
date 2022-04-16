import { APIGatewayEvent, Handler } from 'aws-lambda';
import _ = require('lodash');
import { EventType } from './model/event';
import { MatchWithEventDetails, Match } from './model/match';
import { APIGatewayResponse, ResponseWithHeaders } from './types';
import { StoreHighScore } from './utils/databaseUtils';
import { FindHighestScore } from './utils/scoreUtils';
import { BuildHighScoreJson, CreateResponseJson, GetDataFromFIRST, GetDataFromFIRSTAndReturn, ReturnJsonWithCode } from './utils/utils';

const apiVersion = 'v3.0';

// Common API endpoints
const GetSchedule = async (year: string, eventCode: string, tournamentLevel: string,
  apiVersionOverride: string = apiVersion): Promise<ResponseWithHeaders> => {
  return await GetDataFromFIRST(`${year}/schedule/${eventCode}/${tournamentLevel}`, apiVersionOverride);
};

const GetMatches = async (year: string, eventCode: string, tournamentLevel: string,
  apiVersionOverride: string = apiVersion): Promise<ResponseWithHeaders> => {
  return await GetDataFromFIRST(`${year}/matches/${eventCode}/${tournamentLevel}`, apiVersionOverride);
};

const BuildHybridSchedule = async (year: string, eventCode: string, tournamentLevel: string): Promise<Match[]> => {
  const scheduleResponse = await GetSchedule(year, eventCode, tournamentLevel);
  let matchesResponse: ResponseWithHeaders;
  try {
    // TODO: revert to V3 once FIRST fixes their API
    matchesResponse = await GetMatches(year, eventCode, tournamentLevel, 'v2.0');
  } catch (e) {
    return scheduleResponse.body.Schedule;
  }
  const schedule = scheduleResponse.body.Schedule;
  const matches = matchesResponse.body.Matches;

  _.merge(schedule, matches);

  return schedule;
};

// noinspection JSUnusedGlobalSymbols
const GetEventAwards: Handler = async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
  return await GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/awards/event/${event.pathParameters.eventCode}`, apiVersion);
};

// noinspection JSUnusedGlobalSymbols
const GetEventsV3: Handler = async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
  return await GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/events/`, apiVersion);
};

// noinspection JSUnusedGlobalSymbols
const GetScheduleV3: Handler = async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
  const schedule = await GetSchedule(event.pathParameters.year, event.pathParameters.eventCode, event.pathParameters.tournamentLevel);
  return CreateResponseJson(200, schedule.body, schedule.headers);
};

// noinspection JSUnusedGlobalSymbols
const GetMatchesV3: Handler = async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
  const matches = await GetMatches(event.pathParameters.year, event.pathParameters.eventCode, event.pathParameters.tournamentLevel);
  return CreateResponseJson(200, matches.body, matches.headers);
};

// noinspection JSUnusedGlobalSymbols
const GetEventScoresV3: Handler = async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
  if (event.pathParameters.start === event.pathParameters.end) {
    return await GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/scores/${event.pathParameters.eventCode}/${event.pathParameters.tournamentLevel}?matchNumber=${event.pathParameters.start}`, apiVersion);
  } else {
    return await GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/scores/${event.pathParameters.eventCode}/${event.pathParameters.tournamentLevel}?start=${event.pathParameters.start}&end=${event.pathParameters.end}`, apiVersion);
  }
};

const GetHybridSchedule: Handler = async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
  const schedule = await BuildHybridSchedule(event.pathParameters.year,
    event.pathParameters.eventCode, event.pathParameters.tournamentLevel);
  return CreateResponseJson(200, { Schedule: schedule });
};

// noinspection JSUnusedGlobalSymbols
const GetEventRankingsV3: Handler = async (event: APIGatewayEvent) => {
  return await GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/rankings/${event.pathParameters.eventCode}`, apiVersion);
};

// noinspection JSUnusedGlobalSymbols
const GetDistrictRankingsV3: Handler = async (event: APIGatewayEvent) => {
  const query = [];
  query.push(`districtCode=${event.pathParameters.districtCode}`);
  if (event.queryStringParameters) {
    const top = event.queryStringParameters.top;
    if (top) {
      query.push(`top=${top}`);
    }
  }
  const rankingData = await GetDataFromFIRST(`${event.pathParameters.year}/rankings/district?${query.join('&')}&page=1`, apiVersion);
  if (rankingData.body.statusCode) {
    return ReturnJsonWithCode(rankingData.body.statusCode, rankingData.body.message);
  }
  if (rankingData.body.pageTotal === 1) {
    return ReturnJsonWithCode(200, rankingData.body, rankingData.headers);
  } else {
    const promises: Promise<any>[] = [];
    for (let i = 2; i <= rankingData.body.pageTotal; i++) {
      promises.push(GetDataFromFIRST(`${event.pathParameters.year}/rankings/district?${query.join('&')}&page=${i}`, apiVersion));
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
const GetEventHighScoresV3: Handler = async (event: APIGatewayEvent) => {
  const eventList = await GetDataFromFIRST(`${event.pathParameters.year}/events/`);
  const evtList = eventList.body.Events.filter(evt => evt.code === event.pathParameters.eventCode);
  if (evtList.length !== 1) {
      return ReturnJsonWithCode(404, 'Event not found.');
  }
  const eventDetails = evtList[0];
  const qualMatchList = await BuildHybridSchedule(event.pathParameters.year, event.pathParameters.eventCode, 'qual');
  const playoffMatchList = await BuildHybridSchedule(event.pathParameters.year, event.pathParameters.eventCode, 'playoff');

  let matches: MatchWithEventDetails[] = qualMatchList
      .map(x => { return { event: { eventCode: eventDetails.code, type: 'qual' }, match: x } })
      .concat(playoffMatchList
          .map(x => { return { event: { eventCode: eventDetails.code, type: 'playoff' }, match: x } }));
  matches = matches.filter(match => match.match.postResultTime && match.match.postResultTime !== '' &&
      // TODO: find a better way to filter these demo teams out, this way is not sustainable
      match.match.teams.filter(t => t.teamNumber >= 9986).length === 0);

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
const UpdateHighScores: Handler = async () => {
  const eventList = await GetDataFromFIRST(process.env.FRC_CURRENT_SEASON + '/events');
  const promises: Promise<Match[]>[] = [];
  const order: EventType[] = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);
  for (const _event of eventList.body.Events) {
      const eventDate = new Date(_event.dateStart);
      if (eventDate < currentDate) {
          promises.push(BuildHybridSchedule(process.env.FRC_CURRENT_SEASON, _event.code, 'qual').catch(_ => {
              return [] as Match[];
          }));
          promises.push(BuildHybridSchedule(process.env.FRC_CURRENT_SEASON, _event.code, 'playoff').catch(_ => {
              return [] as Match[];
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
  for (const _event of events) {
      const evt = order[events.indexOf(_event)];
      if (_event.length > 0) {
          for (const match of _event) {
              // TODO: find a better way to filter these demo teams out, this way is not sustainable
              if (match.postResultTime && match.postResultTime !== '' && match.teams.filter(t => t.teamNumber >= 9986).length === 0) {
                  // Result was posted and it's not a demo team, so the match has occurred
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


export { GetEventAwards, GetEventsV3, GetScheduleV3, GetMatchesV3, GetEventScoresV3, GetHybridSchedule,
  GetEventRankingsV3, GetDistrictRankingsV3, GetEventHighScoresV3, UpdateHighScores }
