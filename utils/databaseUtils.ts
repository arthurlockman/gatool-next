import {MatchWithHighScoreDetails} from '../model/match';
const AWS = require('aws-sdk');
const DynamoDB = new AWS.DynamoDB.DocumentClient({region: process.env.SERVICE_AWS_REGION});

/**
 * Store a high score in the database
 * @param year The year for this score
 * @param type The type for this score
 * @param level The competition level (qual or playoff)
 * @param match The match to store
 */
function StoreHighScore(year: string, type: string, level: string, match: MatchWithHighScoreDetails): Promise<any> {
    const params = {
        TableName: 'HighScoresTable',
        Item: {
            yearType: year + type + level,
            year: year,
            type: type,
            level: level,
            matchData: match
        }
    };
    return DynamoDB.put(params, (err, data) => {
        if (err) {
            console.error(err.message);
            return Promise.reject(err);
        } else {
            return Promise.resolve();
        }
    }).promise();
}

/**
 * Get all high scores from the database.
 */
function GetHighScoresFromDb(): Promise<any> {
    const params = {
        TableName: 'HighScoresTable'
    };
    return DynamoDB.scan(params).promise();
}

/**
 * Get the team updates for a particular team.
 * @param teamNumber The team number to retrieve.
 */
function GetTeamUpdatesForTeam(teamNumber: string): Promise<any> {
    const params = {
        TableName: 'TeamUpdatesTable',
        Key: {
            'teamNumber': teamNumber
        }
    };
    return DynamoDB.get(params).promise();
}

/**
 * Store the team update for a particular team.
 * @param teamNumber The team number.
 * @param updateData The update data to store.
 */
function StoreTeamUpdateForTeam(teamNumber: string, updateData: any): Promise<any> {
    const params = {
        TableName: 'TeamUpdatesTable',
        Item: {
            teamNumber: teamNumber,
            data: JSON.stringify(updateData)
        }
    };
    return DynamoDB.put(params, (err, data) => {
        if (err) {
            console.error(err.message);
            return Promise.reject(err);
        } else {
            return Promise.resolve();
        }
    }).promise();
}

/**
 * Get stored user preferences.
 * @param userName The username to retrieve.
 */
function RetrieveUserPreferences(userName: string): Promise<any> {
    const params = {
        TableName: 'UserPreferencesTable',
        Key: {
            'userName': userName
        }
    };
    return DynamoDB.get(params).promise();
}

/**
 * Store a user's preferences.
 * @param userName The username
 * @param preferences The preferences to store.
 */
function StoreUserPreferences(userName: string, preferences: any): Promise<any> {
    const params = {
        TableName: 'UserPreferencesTable',
        Item: {
            userName: userName,
            data: JSON.stringify(preferences)
        }
    };
    return DynamoDB.put(params, (err, data) => {
        if (err) {
            console.error(err.message);
            return Promise.reject(err);
        } else {
            return Promise.resolve();
        }
    }).promise();
}

export {StoreHighScore, GetHighScoresFromDb, GetTeamUpdatesForTeam, StoreTeamUpdateForTeam,
    RetrieveUserPreferences, StoreUserPreferences}
