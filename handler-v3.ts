import { APIGatewayEvent, Handler } from 'aws-lambda';
import _ = require('lodash');
import { APIGatewayResponse, ResponseWithHeaders } from './types';
import { CreateResponseJson, GetDataFromFIRST, GetDataFromFIRSTAndReturn, ReturnJsonWithCode } from './utils/utils';

const apiVersion = 'v3.0';

// Common API endpoints
const GetSchedule = async (year: string, eventCode: string, tournamentLevel: string): Promise<ResponseWithHeaders> => {
  return await GetDataFromFIRST(`${year}/schedule/${eventCode}/${tournamentLevel}`, apiVersion);
};

const GetMatches = async (year: string, eventCode: string, tournamentLevel: string): Promise<ResponseWithHeaders> => {
  return await GetDataFromFIRST(`${year}/matches/${eventCode}/${tournamentLevel}`, apiVersion);
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

  const scheduleResponse = await GetSchedule(event.pathParameters.year, event.pathParameters.eventCode,
    event.pathParameters.tournamentLevel);
  const matchesResponse = await GetMatches(event.pathParameters.year, event.pathParameters.eventCode,
    event.pathParameters.tournamentLevel);
  const schedule = scheduleResponse.body.Schedule;
  const matches = matchesResponse.body.Matches;

  _.merge(schedule, matches);
  const returnData = { Schedule: schedule };
  return CreateResponseJson(200, returnData);
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


export { GetEventAwards, GetEventsV3, GetScheduleV3, GetMatchesV3, GetEventScoresV3, GetHybridSchedule, GetEventRankingsV3, GetDistrictRankingsV3 }