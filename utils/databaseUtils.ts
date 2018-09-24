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
    });
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

export {StoreHighScore, GetHighScoresFromDb}
