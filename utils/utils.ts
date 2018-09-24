const rp = require('request-promise');

/**
 * Get and return data from the FIRST API
 * @param path The path on the FIRST API to call
 * @param callback The lambda callback to return the data
 */
function GetDataFromFIRSTAndReturn(path: string, callback: any) {
    return GetDataFromFIRST(path).then((body) => {
        console.log(body);
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
            'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
            'Content-Type': 'application/json',
            'charset': 'utf-8'
        },
        isBase64Encoded: false
    });
}

export {GetDataFromFIRST, GetDataFromFIRSTAndReturn, ReturnJsonWithCode}
