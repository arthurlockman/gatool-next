import {EventAvatars} from '../model/event';
import {MatchWithHighScoreDetails} from '../model/match';

const rp = require('request-promise');

export class ResponseWithHeaders {
    headers: any;
    body: any;
}

const includeHeaders = (body, response, resolveWithFullResponse) => {
    return {'headers': response.headers, 'body': body};
};

/**
 * Get and return data from the FIRST API
 * @param path The path on the FIRST API to call
 */
const GetDataFromFIRSTAndReturn = (path: string) => {
    return GetDataFromFIRST(path).then((response) => {
        return CreateResponseJson(200, response.body, response.headers);
    }).catch(rejection => {
        return CreateResponseJson(parseInt(rejection.statusCode, 10), rejection.response.body);
    });
};

/**
 * Get and return data from the blue alliance
 * @param path The path on the TBA API to call
 */
const GetDataFromTBAAndReturn = (path: string) => {
    return GetDataFromTBA(path).then((response) => {
        return CreateResponseJson(200, response.body, response.headers);
    }).catch(rejection => {
        return CreateResponseJson(parseInt(rejection.statusCode, 10), rejection.response.body);
    });
};

/**
 * Get data from FIRST and return a promise
 * @param path The path to GET data from
 */
const GetDataFromFIRST = (path: string): Promise<ResponseWithHeaders> => {
    try {
        const options = {
            method: 'GET',
            uri: 'https://frc-api.firstinspires.org/v2.0/' + path,
            json: true,
            headers: {
                'Authorization': process.env.FRC_API_KEY,
                'Accept': 'application/json'
            },
            transform: includeHeaders
        };
        return rp(options);
    } catch (err) {
        return Promise.reject(err);
    }
};

/**
 * Get data from FIRST and return a promise
 * @param path The path to GET data from
 */
const GetDataFromTBA = (path: string): Promise<ResponseWithHeaders> => {
    try {
        const options = {
            method: 'GET',
            uri: 'https://www.thebluealliance.com/api/v3/' + path,
            json: true,
            headers: {
                'X-TBA-Auth-Key': process.env.TBA_API_KEY,
                'Accept': 'application/json'
            },
            transform: includeHeaders
        };
        return rp(options);
    } catch (err) {
        return Promise.reject(err);
    }
};

/**
 * Get data from FIRST for team avatars
 * @param year The team avatar year to get
 * @param eventCode The event code to retrieve
 * @param page The page to get
 */
const GetAvatarData = (year: string, eventCode: string, page?: number): Promise<any> => {
    const pageString = (page != null) ? `&page=${page}` : '';
    const avatarData = GetDataFromFIRST(`${year}/avatars?eventCode=${eventCode}${pageString}`);
    return avatarData.then(response => {
        const avatars = response.body as EventAvatars;
        avatars.teams = avatars.teams.map(team => {
            team.encodedAvatar = (team.encodedAvatar === null) ? null : `api/${year}/avatars/team/${team.teamNumber}/avatar.png`;
            return team;
        });
        return avatars;
    }).catch(rejection => {
        return {
            body: {
                statusCode: parseInt(rejection.statusCode, 10),
                message: rejection.response.body
            }
        };
    });
};

/**
 * Return JSON data to the user with a specific status code.
 * @param statusCode The status code to use in the return.
 * @param body The body data (JSON) to return
 * @param callback The lambda callback function
 * @param headers Additional headers to return with the response
 */
const ReturnJsonWithCode = (statusCode: number, body: any, callback: any, headers?: any) => {
    const responseHeaders = {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        'Content-Type': 'application/json',
        'charset': 'utf-8',
        'Cache-Control': 'no-cache'
    };
    if (headers && headers['last-modified']) {
        responseHeaders['Last-Modified'] = headers['last-modified'];
    }
    return callback(null, {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: responseHeaders,
        isBase64Encoded: false
    });
};

/**
 * Return JSON data to the user with a specific status code.
 * @param statusCode The status code to use in the return.
 * @param body The body data (JSON) to return
 * @param headers Additional headers to return with the response
 */
const CreateResponseJson = (statusCode: number, body: any, headers?: any): any => {
    const responseHeaders = {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        'Content-Type': 'application/json',
        'charset': 'utf-8',
        'Cache-Control': 'no-cache'
    };
    if (headers && headers['last-modified']) {
        responseHeaders['Last-Modified'] = headers['last-modified'];
    }
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: responseHeaders,
        isBase64Encoded: false
    };
};

/**
 * Build a JSON object for a high score
 * @param year The year
 * @param type The score type
 * @param level The score level
 * @param match The score match data
 */
const BuildHighScoreJson = (year: string, type: string, level: string, match: MatchWithHighScoreDetails): any => {
    return {
        yearType: year + type + level,
            year: year,
        type: type,
        level: level,
        matchData: match
    }
};

export {GetDataFromFIRST, GetDataFromFIRSTAndReturn, GetDataFromTBAAndReturn,
    ReturnJsonWithCode, GetAvatarData, BuildHighScoreJson, CreateResponseJson}
