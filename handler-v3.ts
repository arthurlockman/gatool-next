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

export { GetEventAwards, GetEventsV3 }
