const AWS = require('aws-sdk');
const S3 = new AWS.S3({region: process.env.SERVICE_AWS_REGION});
const PreferencesBucketName = 'gatooluserpreferences';

/**
 * Get stored user preferences.
 * @param userName The username to retrieve.
 */
const RetrieveUserPreferences = (userName: string): Promise<any> => {
    const params = {
        Bucket: PreferencesBucketName,
        Key: `${userName}.prefs.json`
    };
    return S3.getObject(params).promise();
};

/**
 * Store a user's preferences.
 * @param userName The username
 * @param preferences The preferences to store.
 */
const StoreUserPreferences = (userName: string, preferences: any): Promise<any> => {
    const params = {
        Bucket: PreferencesBucketName,
        Key: `${userName}.prefs.json`,
        Body: JSON.stringify(preferences)
    };
    return S3.putObject(params).promise();
};

export {RetrieveUserPreferences, StoreUserPreferences}
