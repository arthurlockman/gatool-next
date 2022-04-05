import { APIGatewayEvent, Handler } from 'aws-lambda';
import _ = require('lodash');
import { APIGatewayResponse, ResponseWithHeaders } from './types';
import { CreateResponseJson, GetDataFromFIRST, GetDataFromFIRSTAndReturn } from './utils/utils';

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

  return CreateResponseJson(200, schedule);
};

export { GetEventAwards, GetEventsV3, GetScheduleV3, GetMatchesV3, GetEventScoresV3, GetHybridSchedule }
