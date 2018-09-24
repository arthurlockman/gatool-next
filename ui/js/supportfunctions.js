$("#loadingFeedback").html("Loading support functions...");

function timer() {
	"use strict";
	if (localStorage.clock === "running") {
		// Update the count down every 1 second

		// Get todays date and time
		localStorage.matchTimer -= 1;
		if (localStorage.matchTimer >= 0) {
			if ((matchLength - localStorage.matchTimer) <= autoLength) {
				$("#timer").css({
					"background-color": "orange",
					"color": "black"
				});
				$("#clock").html(localStorage.matchTimer + " AUTO (" + (autoLength - (matchLength - localStorage.matchTimer)) + ")");
			}
			if ((matchLength - localStorage.matchTimer) > autoLength && (localStorage.matchTimer > endGame)) {
				$("#timer").css({
					"background-color": "green",
					"color": "white"
				});
				$("#clock").html(localStorage.matchTimer + " TELEOP");
			}
			if (localStorage.matchTimer <= endGame) {
				$("#timer").css({
					"background-color": "red",
					"animation-delay": "20s",
					"animation-name": "timerHighlight",
					"animation-duration": "1s",
					"animation-iteration-count": "10",
					"color": "white"
				});
				$("#clock").html(localStorage.matchTimer + " ENDGAME");
			}
		} else {
			resetTimer();
		}


	}

	//display the delay on the Announce Screen if we have a schedule
	if (localStorage.qualsList !== '{"Schedule":[]}') {
		$("#matchTimeContainer").removeClass();
		var timeDifference = 0;
		if (currentMatchData.actualStartTime) {
			$("#matchTime").html('<b><span id="currentTime"></span></b><br>Actual match time:<br>' + moment(currentMatchData.actualStartTime).format("MMM Do, h:mm a"));
			$("#matchTimeContainer").removeClass();
			$("#matchTimeContainer").addClass("col2");
			timeDifference = moment(currentMatchData.actualStartTime).diff(currentMatchData.startTime, "minutes");
			if (timeDifference < 0) {
				$("#matchTimeContainer").addClass("alert-success");
			} else if ((timeDifference >= 0) && (timeDifference < 10)) {
				$("#matchTimeContainer").addClass("alert-success");
			} else if ((timeDifference >= 10) && (timeDifference < 20)) {
				$("#matchTimeContainer").addClass("alert-warning");
			} else if (timeDifference >= 20) {
				$("#matchTimeContainer").addClass("alert-danger");
			}
		} else {
			if (localStorage.offseason === "true") {
				$("#matchTime").html('<b><span id="currentTime"></span></b><br>Starts:<br>' + currentMatchData.startTime);
			} else {
				$("#matchTime").html('<b><span id="currentTime"></span></b><br>Starts:<br>' + moment(currentMatchData.startTime).fromNow());

				timeDifference = moment(Date.now()).diff(currentMatchData.startTime, "minutes");
				if (timeDifference < 0) {
					$("#matchTimeContainer").addClass("alert-success");
				} else if ((timeDifference >= 0) && (timeDifference < 10)) {
					$("#matchTimeContainer").addClass("alert-success");
				} else if ((timeDifference >= 10) && (timeDifference < 20)) {
					$("#matchTimeContainer").addClass("alert-warning");
				} else if (timeDifference >= 20) {
					$("#matchTimeContainer").addClass("alert-danger");
				}
			}
			
			$("#matchTimeContainer").addClass("col2");
		}
	}
	$("#currentTime").html(moment().format('h:mm:ss a'));

	//display the last pit visit time
	$("[lastVisit]").each(function () {
		if ($(this).attr("lastvisit") !== "No recent visit") {
			$(this).html(moment($(this).attr("lastVisit")).fromNow());
		}
	});

	//display the amount of localStorage in use
	$("#localStorageUsage").html(localStorageSpace() + " in use");

	//display the last time we had rankings
	$("#allianceselectionlastupdated").html(" (Ranks last updated " + moment(lastRanksUpdate).fromNow() + ")<br>");
	$("#rankstablelastupdated").html("<b>Ranks last updated " + moment(lastRanksUpdate).fromNow() + "</b>");
	//update the warning in the Alliance Selection
	ranksQualsCompare();
}

function localStorageSpace() {
	"use strict";
	var allStrings = '';
	var localStorageSize = {};
	for (var key in window.localStorage) {
		if (window.localStorage.hasOwnProperty(key)) {
			allStrings += window.localStorage[key];
		}
	}
	if (allStrings) {} {
		localStorageSize.size = ((allStrings.length * 16) / (8 * 1024));
		localStorageSize.marker = " KB";
		if (localStorageSize.size > 1024) {
			localStorageSize.marker = " MB";
			localStorageSize.size = localStorageSize.size / 1024;
		}
	}
	return allStrings ? (3 + Math.round(localStorageSize.size)) + localStorageSize.marker : 'Empty (0 KB)';
}

function compressLocalStorage(target, value) {
	"use strict";
	localStorage[target] = LZString.compress(JSON.stringify(value));
}

function decompressLocalStorage(target) {
	"use strict";
	try {
		var value = JSON.parse(localStorage[target]);
		return value;

	} catch (err) {
		return JSON.parse(LZString.decompress(localStorage[target]));
	}
}

function toJSON(dataGrid, headerNames, headerTypes, newLine) {
	"use strict";
	//inits...
	var commentLine = "//";
	var commentLineEnd = "";
	var outputText = "[";
	var numRows = dataGrid.length;
	var numColumns = headerNames.length;

	//begin render loop
	for (var i = 0; i < numRows; i++) {
		var row = dataGrid[i];
		var rowOutput = "";
		outputText += "{";
		for (var j = 0; j < numColumns; j++) {
			if ((headerTypes[j] === "int") || (headerTypes[j] === "float")) {
				rowOutput = row[j] || "null";
			} else {
				rowOutput = '"' + (row[j] || "") + '"';
			}

			outputText += ('"' + headerNames[j] + '"' + ":" + rowOutput);

			if (j < (numColumns - 1)) {
				outputText += ",";
			}
		}
		outputText += "}";
		if (i < (numRows - 1)) {
			outputText += "," + newLine;
		}
	}
	outputText += "]";

	return outputText;
}

function inHallOfFame(team, position) {
	"use strict";
	var hofDisplay = "";
	$("#" + position + "HOF").hide();
	for (i = 0; i < hallOfFame.length; i++) {
		if (team === hallOfFame[i].Chairmans) {
			hofDisplay += hallOfFame[i].Year + " " + hallOfFame[i].Challenge + " Chairman's Award" + localStorage.awardSeparator;
		}
		if ((team === hallOfFame[i].Winner1) || (team === hallOfFame[i].Winner2) || (team === hallOfFame[i].Winner3) || (team === hallOfFame[i].Winner4) || (team === hallOfFame[i].Winner5)) {
			hofDisplay += hallOfFame[i].Year + " " + hallOfFame[i].Challenge + " Winner" + localStorage.awardSeparator;
		}
	}
	if (hofDisplay !== "") {
		hofDisplay = hofDisplay.slice(0, hofDisplay.length - localStorage.awardSeparator.length);
		$("#" + position + "HOF").html(hofDisplay);
		$("#" + position + "HOF").show();
	}

}

function startTimer() {
	"use strict";
	if (localStorage.clock === "running") {
		resetTimer();
	} else {
		localStorage.clock = "running";
	}
}

function resetTimer() {
	"use strict";
	localStorage.matchTimer = matchLength;
	$("#timer").css({
		"background-color": "white",
		"animation-delay": "0s",
		"animation-name": "timerReset",
		"animation-duration": "1s",
		"animation-iteration-count": "1",
		"color": "black"
	});
	localStorage.clock = "ready";
	$("#clock").html("Tap for match timer");
}

function resetLocalStorage() {
	"use strict";
	BootstrapDialog.show({
		type: 'type-danger',
		title: '<b>Reset Local Storage</b>',
		message: 'You are about to erase all of your local changes to team information. This action will effectively reset gatool to its "factory" condition. Are you sure you want to do this?',
		buttons: [{
			icon: 'glyphicon glyphicon-check',
			label: "No, don't reset my local changes.",
			hotkey: 78, // "N".
			cssClass: "btn btn-success alertButton",
			action: function (dialogRef) {
				dialogRef.close();
			}
		}, {
			icon: 'glyphicon glyphicon-refresh',
			label: 'Yes, I do want to reset my local changes.<br>I understand that I will now need to<br>re-enter my changes or<br>download them from the gatool cloud.',
			hotkey: 13, // Enter.
			cssClass: 'btn btn-danger alertButton',
			action: function (dialogRef) {
				dialogRef.close();
				localStorage.clear();
				BootstrapDialog.show({
					message: "LocalStorage cleared.<br>Page will now reload to recover data from the server. Select your event after the page reloads.",
					buttons: [{
						icon: 'glyphicon glyphicon-refresh',
						label: 'OK',
						hotkey: 13, // Enter.
						title: 'OK',
						action: function (dialogRef) {
							location.reload();
						}
					}]
				});

			}
		}]
	});
}

function logout() {
	"use strict";
	BootstrapDialog.show({
		type: 'type-primary',
		title: '<b>Logout of gatool</b>',
		message: 'You are about to logout of gatool. Your local changes will be preserved until you reset your browser cache, so your changes will be here when you login again on this device. Are you sure you want to do this?',
		buttons: [{
			icon: 'glyphicon glyphicon-check',
			label: "No, I don't want to logout now.",
			hotkey: 78, // "N".
			cssClass: "btn btn-info col-md-5 col-xs-12 col-sm-12 alertButton",
			action: function (dialogRef) {
				dialogRef.close();
			}
		}, {
			icon: 'glyphicon glyphicon-log-out',
			label: 'Yes, I do want to logout now.',
			hotkey: 13, // Enter.
			cssClass: 'btn btn-success col-md-5 col-xs-12 col-sm-12 alertButton',
			action: function (dialogRef) {
				dialogRef.close();
				location.href = "/logout";
			}
		}]
	});
}

function getCookie(cname) {
	"use strict";
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) === ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) === 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function openTab(evt, tabID) {
	"use strict";

	// Get all elements with class="tabcontent" and hide them
	$(".tabcontent").hide();

	// Get all elements with class="tablinks" and remove the class "active"
	$(".tablinks").removeClass('active');

	// Show the current tab, and add an "active" class to the link that opened the tab
	$("#" + tabID).show();
	//document.getElementById(tabID).style.display = "block";
	//$("#" + evt.currentTarget).addClass("active");
	evt.currentTarget.className += " active";

	//resize the window
	scaleRows();
}

function scaleRows() {
	"use strict";
	var height = window.innerHeight;
	var width = window.innerWidth - 30;
	var col1width = width / 12;
	var col2width = width / 6;
	var col3width = width / 4;
	var col4width = width / 3;
	var col5width = width / 12 * 5;
	var col6width = width / 2;
	var col9width = width / 4 * 3;
	var col10width = width / 6 * 5;
	var verticalDivisions = 3;
	if (inChamps() || (inSubdivision() && (localStorage.currentMatch > JSON.parse(localStorage.qualsList).Schedule.length))) {
		verticalDivisions = 4;
	}
	var announceHeight = Math.round((height - $("#navbar").outerHeight() - $("#appTab").outerHeight() - $("#gameButtonsAnnounce").outerHeight() - $("#footer").outerHeight() - $("#announceTableHeader").outerHeight()) / (verticalDivisions * 2) - 10);
	var playByPlayHeight = Math.round((height - $("#navbar").outerHeight() - $("#appTab").outerHeight() - $("#gameButtonsPlayByPlay").outerHeight() - $("#footer").outerHeight() - $("#announceTableHeader").outerHeight()) / verticalDivisions - 25);
	$(".redAlliancePlayByPlay,.blueAlliancePlayByPlay").css("height", playByPlayHeight + "px");
	$(".redAlliance,.blueAlliance").css("height", announceHeight + "px");
	$(".col1").css("width", col1width + "px");
	$(".col2").css("width", col2width + "px");
	$(".col3").css("width", col3width + "px");
	$(".col4").css("width", col4width + "px");
	$(".col5").css("width", col5width + "px");
	$(".col6").css("width", col6width + "px");
	$(".col9").css("width", col9width + "px");
	$(".col10").css("width", col10width + "px");
	$(".spacer").css("height", ($("#navbar").outerHeight() - 35) + "px");
}

function tournamentLevel(tournament) {
	"use strict";
	if (tournament === "Qualification") {
		return "qual";
	} else {
		return "playoff";
	}
}

function trimArray(arr) {
	"use strict";
	for (var i = 0; i <= arr.length - 1; i++) {
		arr[i] = arr[i].trim();
	}
	return arr;
}

function loadEnvironment() {
	"use strict";
	BootstrapDialog.show({
		type: 'type-warning',
		title: '<b>Load environment from the gatool Cloud</b>',
		message: 'You are about to load your saved gatool environment from the gatool Cloud. <b>This will replace your gatool environment with what you have previously pushed to gatool Cloud.<br><b>Are you sure you want to do this?</b>',
		buttons: [{
			icon: 'glyphicon glyphicon-check',
			label: "No, I don't want to<br>load my environment now.",
			hotkey: 78, // "N".
			cssClass: "btn btn-info col-md-5 col-xs-12 col-sm-12 alertButton",
			action: function (dialogRef) {
				dialogRef.close();
			}
		}, {
			icon: 'glyphicon glyphicon-cloud-download',
			label: 'Yes, I do want to<br>load my environment now.',
			hotkey: 13, // Enter.
			cssClass: 'btn btn-success col-md-5 col-xs-12 col-sm-12 alertButton',
			action: function (dialogRef) {

				var req = new XMLHttpRequest();
				req.open('GET', apiURL + '/loadenvironment/');
				//req.setRequestHeader("userKey", getCookie("loggedin"));
				req.addEventListener('load', function () {
					dialogRef.close();
					environment = JSON.parse(req.responseText);
					var environmentKeys = Object.keys(environment.localStorage);
					for (var i = 0; i < environmentKeys.length; i++) {
						if (environmentKeys[i].startsWith("teamData")) {
							localStorage[environmentKeys[i]] = environment.localStorage[environmentKeys[i]];
							compressLocalStorage(environmentKeys[i], JSON.parse(environment.localStorage[environmentKeys[i]]));
						} else {
							localStorage[environmentKeys[i]] = environment.localStorage[environmentKeys[i]];
						}
					}
					playoffResults = environment.playoffResults;
					allianceTeamList = environment.allianceTeamList;
					allianceListUnsorted = environment.allianceListUnsorted;
					rankingsList = environment.rankingsList;
					eventTeamList = environment.eventTeamList;
					eventQualsSchedule = environment.eventQualsSchedule;
					eventPlayoffSchedule = environment.eventPlayoffSchedule;
					currentAllianceChoice = environment.currentAllianceChoice;
					allianceChoices = environment.allianceChoices;
					replacementAlliance = environment.replacementAlliance;
					allianceChoicesUndo = environment.allianceChoicesUndo;
					allianceListUnsortedUndo = environment.allianceListUnsortedUndo;
					allianceTeamListUndo = environment.allianceTeamListUndo;
					teamNumberUndo = environment.teamNumberUndo;
					teamContainerUndo = environment.teamContainerUndo;
					lastMatchPlayed = environment.lastMatchPlayed;
					allianceSelectionTableUndo = environment.allianceSelectionTableUndo;
					currentMatchData = environment.currentMatchData;
					teamCountTotal = environment.teamCountTotal;
					haveRanks = environment.haveRanks;
					highScores = environment.highScores;
					currentEventList = environment.currentEventList;
					lastRanksUpdate = environment.lastRanksUpdate;
					lastQualsUpdate = environment.lastQualsUpdate;
					qualsComplete = environment.qualsComplete;
					haveSchedule = environment.haveSchedule;
					matchCount = environment.matchCount;
					allianceSelectionReady = environment.allianceSelectionReady;

					BootstrapDialog.show({
						message: "Environment loaded from gatool Cloud. Your local data has been replaced.",
						buttons: [{
							icon: 'glyphicon glyphicon-cloud-download',
							cssClass: 'btn btn-success col-md-5 col-xs-12 col-sm-12 alertButton',
							label: 'OK',
							hotkey: 13, // Enter.
							title: 'OK',
							action: function (dialogRef) {
								dialogRef.close();
								location.reload();
							}
						}]
					});
				});
				req.send();

			}
		}]
	});
}

function saveEnvironment() {
	"use strict";

	BootstrapDialog.show({
		type: 'type-warning',
		title: '<b>Save environment to the gatool Cloud</b>',
		message: 'You are about to save your gatool environment to the gatool Cloud.<br><b>Are you sure you want to do this?</b>',
		buttons: [{
			icon: 'glyphicon glyphicon-check',
			label: "No, I don't want to<br>save my environment now.",
			hotkey: 78, // "N".
			cssClass: "btn btn-info col-md-5 col-xs-12 col-sm-12 alertButton",
			action: function (dialogRef) {
				dialogRef.close();
			}
		}, {
			icon: 'glyphicon glyphicon-cloud-download',
			label: 'Yes, I do want to<br>save my environment now.',
			hotkey: 13, // Enter.
			cssClass: 'btn btn-success col-md-5 col-xs-12 col-sm-12 alertButton',
			action: function (dialogRef) {
				environment.localStorage = {};
				var localStorageKeys = Object.keys(localStorage);
				for (var i = 0; i < localStorageKeys.length; i++) {
					if (localStorageKeys[i].startsWith("teamData")) {
						environment.localStorage[localStorageKeys[i]] = JSON.stringify(decompressLocalStorage(localStorageKeys[i]));
					} else {
						environment.localStorage[localStorageKeys[i]] = localStorage[localStorageKeys[i]];
					}
				}
				environment.playoffResults = playoffResults;
				environment.allianceTeamList = allianceTeamList;
				environment.allianceListUnsorted = allianceListUnsorted;
				environment.rankingsList = rankingsList;
				environment.eventTeamList = eventTeamList;
				environment.eventQualsSchedule = eventQualsSchedule;
				environment.eventPlayoffSchedule = eventPlayoffSchedule;
				environment.currentAllianceChoice = currentAllianceChoice;
				environment.allianceChoices = allianceChoices;
				environment.replacementAlliance = replacementAlliance;
				environment.allianceChoicesUndo = allianceChoicesUndo;
				environment.allianceListUnsortedUndo = allianceListUnsortedUndo;
				environment.allianceTeamListUndo = allianceTeamListUndo;
				environment.teamNumberUndo = teamNumberUndo;
				environment.teamContainerUndo = teamContainerUndo;
				environment.lastMatchPlayed = lastMatchPlayed;
				environment.allianceSelectionTableUndo = allianceSelectionTableUndo;
				environment.currentMatchData = currentMatchData;
				environment.teamCountTotal = teamCountTotal;
				environment.haveRanks = haveRanks;
				environment.highScores = highScores;
				environment.currentEventList = currentEventList;
				environment.lastRanksUpdate = lastRanksUpdate;
				environment.lastQualsUpdate = lastQualsUpdate;
				environment.qualsComplete = qualsComplete;
				environment.haveSchedule = haveSchedule;
				environment.matchCount = matchCount;
				environment.allianceSelectionReady = allianceSelectionReady;

				var req = new XMLHttpRequest();
				req.open('POST', apiURL + '/saveenvironment/');
				req.setRequestHeader("Content-type", "application/json");
				//req.setRequestHeader("userKey", getCookie("loggedin"));
				req.addEventListener('load', function () {
					dialogRef.close();
					if (req.responseText === "OK") {
						BootstrapDialog.show({
							message: "Environment saved to gatool Cloud.",
							buttons: [{
								icon: 'glyphicon glyphicon-cloud-download',
								cssClass: 'btn btn-success col-md-5 col-xs-12 col-sm-12 alertButton',
								label: 'OK',
								hotkey: 13, // Enter.
								title: 'OK',
								action: function (dialogRef) {
									dialogRef.close();

								}
							}]
						});
					} else {
						BootstrapDialog.show({
							message: "Environment not saved to gatool Cloud.<br>Please try again.",
							buttons: [{
								icon: 'glyphicon glyphicon-cloud-download',
								cssClass: 'btn btn-danger col-md-5 col-xs-12 col-sm-12 alertButton',
								label: 'OK',
								hotkey: 13, // Enter.
								title: 'OK',
								action: function (dialogRef) {
									dialogRef.close();

								}
							}]
						});
					}
				});
				req.send(JSON.stringify(environment));

			}
		}]
	});
}

function inChamps() {
	"use strict";
	if (champs.indexOf(localStorage.currentEvent) >= 0) {
		return true;
	} else {
		return false;
	}
}

function inDivision() {
	"use strict";
	if (champDivisions.indexOf(localStorage.currentEvent) >= 0) {
		return true;
	} else {
		return false;
	}
}

function inSubdivision() {
	"use strict";
	if (champSubdivisions.indexOf(localStorage.currentEvent) >= 0) {
		return true;
	} else {
		return false;
	}
}

function inMiChamps() {
	"use strict";
	if (miChamps.indexOf(localStorage.currentEvent) >= 0) {
		return true;
	} else {
		return false;
	}
}

function inMiDivision() {
	"use strict";
	if (miDivisions.indexOf(localStorage.currentEvent) >= 0) {
		return true;
	} else {
		return false;
	}
}

