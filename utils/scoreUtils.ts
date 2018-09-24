import {MatchWithEventDetails, MatchWithHighScoreDetails} from '../model/match';

/**
 * Finds the highest score of a list of matches
 * @param matches Matches to find the highest score of
 */
function FindHighestScore(matches: MatchWithEventDetails[]): MatchWithHighScoreDetails {
    let highScore = 0;
    let alliance = '';
    let _match: MatchWithEventDetails;
    for (const match of matches) {
        if (match.match.scoreBlueFinal > highScore) {
            highScore = match.match.scoreBlueFinal;
            alliance = 'blue';
            _match = match;
        }
        if (match.match.scoreRedFinal > highScore) {
            highScore = match.match.scoreRedFinal;
            alliance = 'red';
            _match = match;
        }
    }
    return {
        event: _match.event,
        highScoreAlliance: alliance,
        match: _match.match
    };
}

export {FindHighestScore}
