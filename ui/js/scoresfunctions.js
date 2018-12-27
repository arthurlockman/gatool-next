$("#loadingFeedback").html("Loading scoring functions...");

function getSeasonHighScores(year) {
    "use strict";
    var promises = [];
    if (year === 2018) {
        for (var i = 0; i < currentEventList.length; i++) {
            promises.push(new Promise(function (resolve, reject) {
                getEventScores(currentEventList[i].code, currentEventList[i].type, year, "qual");
            }));
            promises.push(new Promise(function (resolve, reject) {
                getEventScores(currentEventList[i].code, currentEventList[i].type, year, "playoff");
            }));
        }
        Promise.all(promises);
    }
}

function getEventScores(eventCode, type, year, tlevel) {
    "use strict";
    return new Promise(function (resolve, reject) {

        var req = new XMLHttpRequest();
        req.open('GET', apiURL + year + '/schedule/' + eventCode + "/" + tlevel + "?returnschedule=false");
        req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
        req.addEventListener('load', function () {
            resolve(JSON.parse(req.responseText));
        });
        req.send();
    });
}

function winningAllianceTeams(matchData) {
    "use strict";
    const teams = [];
    for (let i = 0; i < matchData.match.teams.length; i++) {
        if (matchData.match.teams[i].station.toLowerCase().startsWith(matchData.highScoreAlliance)) {
            teams.push(matchData.match.teams[i].teamNumber);
        }
    }
    return teams.join(", ");
}

function findHighestScore(matchData) {
    "use strict";
    return (matchData.scoreRedFinal > matchData.scoreBlueFinal) ? matchData.scoreRedFinal : matchData.scoreBlueFinal;
}

function getHighScores() {
    "use strict";
    var req = new XMLHttpRequest();
    var eventNames = JSON.parse(localStorage.events);
    req.open('GET', apiURL + localStorage.currentYear + '/highscores');
    req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req.addEventListener('load', function () {
        const data = JSON.parse(req.responseText);
        const overallQual = data.filter(x => x.yearType.includes("overallqual"));
        const penaltyFreeQual = data.filter(x => x.yearType.includes("penaltyFreequal"));
        const overallPlayoff = data.filter(x => x.yearType.includes("overallplayoff"));
        const penaltyFreePlayoff = data.filter(x => x.yearType.includes("penaltyFreeplayoff"));
        const offsettingQual = data.filter(x => x.yearType.includes("offsettingqual"));
        const offsettingPlayoff = data.filter(x => x.yearType.includes("offsettingplayoff"));
        $("#highscoreyear").html(" " + localStorage.currentYear);
        if (penaltyFreeQual.length > 0) {
            const data = penaltyFreeQual[0].matchData;
            $("#highQualsNoFouls").html("Qual (no fouls) " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
        if (offsettingQual.length > 0) {
            const data = offsettingQual[0].matchData;
            $("#highQualsOffsettingFouls").html("Qual (offsetting fouls) " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
        if (overallQual.length > 0) {
            const data = overallQual[0].matchData;
            $("#highQuals").html("Qual " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
        if (penaltyFreePlayoff.length > 0) {
            const data = penaltyFreePlayoff[0].matchData;
            $("#highPlayoffNoFouls").html("Playoff (no fouls) " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
        if (offsettingPlayoff.length > 0) {
            const data = offsettingPlayoff[0].matchData;
            $("#highPlayoffOffsettingFouls").html("Playoff (offsetting fouls) " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
        if (overallPlayoff.length > 0) {
            const data = overallPlayoff[0].matchData;
            $("#highPlayoff").html("Playoff " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
    });
    var req2 = new XMLHttpRequest();
    req2.open('GET', apiURL + localStorage.currentYear + '/highscores/' + localStorage.currentEvent);
    req2.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req2.addEventListener('load', function () {
        $("#eventhighscorestable").html('<thead><tr><td colspan="2">Event High Scores</td></tr></thead><tr><td id="eventHighQualsNoFouls">Qual (no penalties)<br>No matches meet criteria<br></td><td id="eventHighPlayoffNoFouls">Playoff (no penalties)<br>No matches meet criteria</td></tr><tr> <td id="eventHighQualsOffsettingFouls">Qual (offsetting fouls)<br>No matches meet criteria<br></td><td id="eventHighPlayoffOffsettingFouls">Playoff (offsetting fouls)<br>No matches meet criteria<br></td></tr><tr><td id="eventHighQuals">Qual<br>No matches meet criteria<br></td><td id="eventHighPlayoff">Playoff<br>No matches meet criteria</td></tr>');
        const data = JSON.parse(req2.responseText);
        const overallQual = data.filter(x => x.yearType.includes("overallqual"));
        const penaltyFreeQual = data.filter(x => x.yearType.includes("penaltyFreequal"));
        const overallPlayoff = data.filter(x => x.yearType.includes("overallplayoff"));
        const penaltyFreePlayoff = data.filter(x => x.yearType.includes("penaltyFreeplayoff"));
        const offsettingQual = data.filter(x => x.yearType.includes("offsettingqual"));
        const offsettingPlayoff = data.filter(x => x.yearType.includes("offsettingplayoff"));
        if (penaltyFreeQual.length > 0) {
            const data = penaltyFreeQual[0].matchData;
            $("#eventHighQualsNoFouls").html("Qual (no fouls) " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
        if (offsettingQual.length > 0) {
            const data = offsettingQual[0].matchData;
            $("#eventHighQualsOffsettingFouls").html("Qual (offsetting fouls) " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
        if (overallQual.length > 0) {
            const data = overallQual[0].matchData;
            $("#eventHighQuals").html("Qual " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
        if (penaltyFreePlayoff.length > 0) {
            const data = penaltyFreePlayoff[0].matchData;
            $("#eventHighPlayoffNoFouls").html("Playoff (no fouls) " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
        if (offsettingPlayoff.length > 0) {
            const data = offsettingPlayoff[0].matchData;
            $("#eventHighPlayoffOffsettingFouls").html("Playoff (offsetting fouls) " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
        if (overallPlayoff.length > 0) {
            const data = overallPlayoff[0].matchData;
            $("#eventHighPlayoff").html("Playoff " + findHighestScore(data.match) + "<br>Match " + data.match.matchNumber + "<br>" + eventNames[data.event.eventCode] + "<br>" + data.highScoreAlliance + " alliance (" + winningAllianceTeams(data) + ")");
        }
    });
    req2.send();
    req.send();

}

function getTeamRanks() {
    "use strict";
    $("#rankUpdateContainer").html("Loading ranking data...");
    $('#ranksProgressBar').show();
    $('#teamRanksPicker').addClass('alert-danger');
    var team = {};
    var req = new XMLHttpRequest();
    req.open('GET', apiURL + localStorage.currentYear + '/rankings/' + localStorage.currentEvent);
    req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req.addEventListener('load', function () {
        var data = JSON.parse(req.responseText);
        if (data.Rankings.length === 0) {
            $("#rankingDisplay").html('<b>No Rankings available.</b>');
            $("#allianceSelectionPlaceholder").show();
            $("#allianceSelectionTable").hide();
            allianceListUnsorted = [];
            var teamList = JSON.parse(localStorage.teamList);
            for (var j = 0; j < teamList.length; j++) {
                allianceListUnsorted[j] = teamList[j].teamNumber;
                //team = JSON.parse(localStorage["teamData" + teamList[j].teamNumber]);
                team = decompressLocalStorage("teamData" + teamList[j].teamNumber);

                team.rank = "";
                team.sortOrder1 = "";
                team.sortOrder2 = "";
                team.sortOrder3 = "";
                team.sortOrder4 = "";
                team.sortOrder5 = "";
                team.sortOrder6 = "";
                team.wins = "";
                team.losses = "";
                team.ties = "";
                team.qualAverage = "";
                team.dq = "";
                team.matchesPlayed = "";
                $("#teamTableRank" + teamList[j].teamNumber).html("");
                $("#teamTableRank" + teamList[j].teamNumber).attr("class", teamTableRankHighlight(100));
                //localStorage["teamData" + teamList[j].teamNumber] = JSON.stringify(team);
                compressLocalStorage("teamData" + teamList[j].teamNumber, team);
            }
        } else {
            haveRanks = true;
            localStorage.Rankings = JSON.stringify(data.Rankings);
            if (localStorage.currentMatch > JSON.parse(localStorage.qualsList).Schedule.length) {
                $("#rankingDisplay").html("<b>Qual Seed<b>");
            } else {
                $("#rankingDisplay").html('<b>Ranking</b>');
            }
            $('#ranksContainer').html('<p class = "eventName">' + localStorage.eventName + ' (<b><span id="rankstablelastupdated"></span></b>)</p><p>This table lists the teams in rank order for this competition. This table updates during the competition, and freezes once Playoff Matches begin. </p><table id="ranksTable" class="table table-condensed table-responsive table-bordered table-striped"></table>');
            var ranksList = '<thead  id="ranksTableHead" class="thead-default"><tr><td class="col1"><b>Team #</b></td><td class="col1"><b>Rank</b></td><td class="col2"><b>Team Name</b></td><td class = "col1"><b>RP Avg.</b></td><td class="col1"><b>Wins</b></td><td  class="col1"><b>Losses</b></td><td class="col1"><b>Ties</b></td><td class="col1"><b>Qual Avg</b></td><td class="col1"><b>DQ</b></td><td class="col1"><b>Matches Played</b></td></tr></thead><tbody>';

            for (var i = 0; i < data.Rankings.length; i++) {

                //team = JSON.parse(localStorage["teamData" + data.Rankings[i].teamNumber]);
                team = decompressLocalStorage("teamData" + data.Rankings[i].teamNumber);

                team.rank = data.Rankings[i].rank;
                allianceTeamList[i] = data.Rankings[i].teamNumber;
                allianceListUnsorted[i] = data.Rankings[i].teamNumber;
                rankingsList = data.Rankings[i].teamNumber;
                team.sortOrder1 = data.Rankings[i].sortOrder1;
                team.sortOrder2 = data.Rankings[i].sortOrder2;
                team.sortOrder3 = data.Rankings[i].sortOrder3;
                team.sortOrder4 = data.Rankings[i].sortOrder4;
                team.sortOrder5 = data.Rankings[i].sortOrder5;
                team.sortOrder6 = data.Rankings[i].sortOrder6;
                team.wins = data.Rankings[i].wins;
                team.losses = data.Rankings[i].losses;
                team.ties = data.Rankings[i].ties;
                team.qualAverage = data.Rankings[i].qualAverage;
                team.dq = data.Rankings[i].dq;
                team.matchesPlayed = data.Rankings[i].matchesPlayed;
                $("#teamTableRank" + data.Rankings[i].teamNumber).html(data.Rankings[i].rank);
                $("#teamTableRank" + data.Rankings[i].teamNumber).attr("class", teamTableRankHighlight(data.Rankings[i].rank));
                ranksList += updateRanksTableRow(team, data.Rankings[i].teamNumber);
                //localStorage["teamData" + data.Rankings[i].teamNumber] = JSON.stringify(team);
                compressLocalStorage("teamData" + data.Rankings[i].teamNumber, team);

                if (data.Rankings[i].matchesPlayed < matchCount) {
                    allianceSelectionReady = false;
                } else {
                    allianceSelectionReady = true;
                }

            }
            $("#ranksProgressBar").hide();
            $('#ranksTable').html(ranksList + "</tbody>");
            $('#teamRanksPicker').removeClass('alert-danger');
            $('#teamRanksPicker').addClass('alert-success');
            lastRanksUpdate = req.getResponseHeader("Last-Modified");

            $("#allianceUndoButton").hide();
            allianceChoices.Alliance1Captain = allianceTeamList[0];
            $("#Alliance1Captain").html("Alliance 1 Captain<div class ='allianceTeam allianceCaptain' captain='Alliance1Captain' teamnumber = '" + allianceTeamList[0] + "' id='allianceTeam" + allianceTeamList[0] + "' onclick='chosenAllianceAlert(this)'>" + allianceTeamList.shift() + "</div>");
            allianceChoices.Alliance2Captain = allianceTeamList[0];
            $("#Alliance2Captain").html("Alliance 2 Captain<div class ='allianceTeam allianceCaptain' captain='Alliance2Captain' teamnumber = '" + allianceTeamList[0] + "' id='allianceTeam" + allianceTeamList[0] + "' onclick='allianceAlert(this)'>" + allianceTeamList.shift() + "</div>");
            allianceChoices.Alliance3Captain = allianceTeamList[0];
            $("#Alliance3Captain").html("Alliance 3 Captain<div class ='allianceTeam allianceCaptain' captain='Alliance3Captain' teamnumber = '" + allianceTeamList[0] + "' id='allianceTeam" + allianceTeamList[0] + "' onclick='allianceAlert(this)'>" + allianceTeamList.shift() + "</div>");
            allianceChoices.Alliance4Captain = allianceTeamList[0];
            $("#Alliance4Captain").html("Alliance 4 Captain<div class ='allianceTeam allianceCaptain' captain='Alliance4Captain' teamnumber = '" + allianceTeamList[0] + "' id='allianceTeam" + allianceTeamList[0] + "' onclick='allianceAlert(this)'>" + allianceTeamList.shift() + "</div>");
            allianceChoices.Alliance5Captain = allianceTeamList[0];
            $("#Alliance5Captain").html("Alliance 5 Captain<div class ='allianceTeam allianceCaptain' captain='Alliance5Captain' teamnumber = '" + allianceTeamList[0] + "' id='allianceTeam" + allianceTeamList[0] + "' onclick='allianceAlert(this)'>" + allianceTeamList.shift() + "</div>");
            allianceChoices.Alliance6Captain = allianceTeamList[0];
            $("#Alliance6Captain").html("Alliance 6 Captain<div class ='allianceTeam allianceCaptain' captain='Alliance6Captain' teamnumber = '" + allianceTeamList[0] + "' id='allianceTeam" + allianceTeamList[0] + "' onclick='allianceAlert(this)'>" + allianceTeamList.shift() + "</div>");
            allianceChoices.Alliance7Captain = allianceTeamList[0];
            $("#Alliance7Captain").html("Alliance 7 Captain<div class ='allianceTeam allianceCaptain' captain='Alliance7Captain' teamnumber = '" + allianceTeamList[0] + "' id='allianceTeam" + allianceTeamList[0] + "' onclick='allianceAlert(this)'>" + allianceTeamList.shift() + "</div>");
            allianceChoices.Alliance8Captain = allianceTeamList[0];
            $("#Alliance8Captain").html("Alliance 8 Captain<div class ='allianceTeam allianceCaptain' captain='Alliance8Captain' teamnumber = '" + allianceTeamList[0] + "' id='allianceTeam" + allianceTeamList[0] + "' onclick='allianceAlert(this)'>" + allianceTeamList.shift() + "</div>");

            $("#backupAllianceTeam1").html("<div id='backupAllianceTeamContainer1' class ='allianceTeam' captain='alliance' teamnumber=" + allianceTeamList[0] + " onclick='allianceAlert(this)'>" + allianceTeamList[0] + "</div>");
            $("#backupAllianceTeam2").html("<div id='backupAllianceTeamContainer2' class ='allianceTeam' captain='alliance' teamnumber=" + allianceTeamList[1] + " onclick='allianceAlert(this)'>" + allianceTeamList[1] + "</div>");
            $("#backupAllianceTeam3").html("<div id='backupAllianceTeamContainer3' class ='allianceTeam' captain='alliance' teamnumber=" + allianceTeamList[2] + " onclick='allianceAlert(this)'>" + allianceTeamList[2] + "</div>");
            $("#backupAllianceTeam4").html("<div id='backupAllianceTeamContainer4' class ='allianceTeam' captain='alliance' teamnumber=" + allianceTeamList[3] + " onclick='allianceAlert(this)'>" + allianceTeamList[3] + "</div>");
            $("#backupAllianceTeam5").html("<div id='backupAllianceTeamContainer5' class ='allianceTeam' captain='alliance' teamnumber=" + allianceTeamList[4] + " onclick='allianceAlert(this)'>" + allianceTeamList[4] + "</div>");
            $("#backupAllianceTeam6").html("<div id='backupAllianceTeamContainer6' class ='allianceTeam' captain='alliance' teamnumber=" + allianceTeamList[5] + " onclick='allianceAlert(this)'>" + allianceTeamList[5] + "</div>");
            $("#backupAllianceTeam7").html("<div id='backupAllianceTeamContainer7' class ='allianceTeam' captain='alliance' teamnumber=" + allianceTeamList[6] + " onclick='allianceAlert(this)'>" + allianceTeamList[6] + "</div>");
            $("#backupAllianceTeam8").html("<div id='backupAllianceTeamContainer8' class ='allianceTeam' captain='alliance' teamnumber=" + allianceTeamList[7] + " onclick='allianceAlert(this)'>" + allianceTeamList[7] + "</div>");

            allianceTeamList = sortAllianceTeams(allianceTeamList);
            displayAwardsTeams(allianceListUnsorted.slice(0));

            $("#rankUpdateContainer").html(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
        }
    });
    if (localStorage.offseason !== "true") {
        req.send();
    }
}
