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
const StoreHighScore = (year: string, type: string, level: string, match: MatchWithHighScoreDetails): Promise<any> => {
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
            console.log(`Stored high score for ${year} ${type} ${level}: ${match.event.eventCode}`);
            return Promise.resolve();
        }
    }).promise();
};

/**
 * Get all high scores from the database.
 */
const GetHighScoresFromDb = (): Promise<any> => {
    const params = {
        TableName: 'HighScoresTable'
    };
    return DynamoDB.scan(params).promise();
};

/**
 * Get the team updates for a particular team.
 * @param teamNumber The team number to retrieve.
 */
const GetTeamUpdatesForTeam = (teamNumber: string): Promise<any> => {
    const params = {
        TableName: 'TeamUpdatesTable',
        Key: {
            'teamNumber': teamNumber
        }
    };
    return DynamoDB.get(params).promise();
};

/**
 * Store the team update for a particular team.
 * @param teamNumber The team number.
 * @param updateData The update data to store.
 */
const StoreTeamUpdateForTeam = (teamNumber: string, updateData: any): Promise<any> => {
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
};

export {StoreHighScore, GetHighScoresFromDb, GetTeamUpdatesForTeam, StoreTeamUpdateForTeam}
