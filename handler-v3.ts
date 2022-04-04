import { APIGatewayEvent, Handler } from 'aws-lambda';
import { GetDataFromFIRSTAndReturn } from './utils/utils';

const apiVersion = 'v3.0';

// noinspection JSUnusedGlobalSymbols
const GetEventAwards: Handler = async (event: APIGatewayEvent) => {
  return await GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/awards/event/${event.pathParameters.eventCode}`, apiVersion);
};

// noinspection JSUnusedGlobalSymbols
const GetEventsV3: Handler = async (event: APIGatewayEvent) => {
  return await GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/events/`, apiVersion);
};

// noinspection JSUnusedGlobalSymbols
const GetScheduleV3: Handler = async (event: APIGatewayEvent) => {
  return await GetDataFromFIRSTAndReturn(event.pathParameters.year + '/schedule/' +
      event.pathParameters.eventCode + '/' + event.pathParameters.tournamentLevel, apiVersion);
};

// noinspection JSUnusedGlobalSymbols
const GetMatchesV3: Handler = async (event: APIGatewayEvent) => {
  return await GetDataFromFIRSTAndReturn(event.pathParameters.year + '/matches/' +
      event.pathParameters.eventCode + '/' + event.pathParameters.tournamentLevel, apiVersion);
};

// noinspection JSUnusedGlobalSymbols
const GetEventScoresV3: Handler = async (event: APIGatewayEvent) => {
  return await GetDataFromFIRSTAndReturn(`${event.pathParameters.year}/scores/${event.pathParameters.eventCode}/${event.pathParameters.tournamentLevel}/${event.pathParameters.start}/${event.pathParameters.end}`, apiVersion);
};

export { GetEventAwards, GetEventsV3, GetScheduleV3, GetMatchesV3, GetEventScoresV3 }
