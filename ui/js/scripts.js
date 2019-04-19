/*global moment */
/*global BootstrapDialog */
/*global Base64 */

//Create the localStorage variables if they don't exist

if (!localStorage.currentMatch) {
    localStorage.currentMatch = 1
}
if (!localStorage.inPlayoffs) {
    localStorage.inPlayoffs = "false"
}
if (!localStorage.Alliances) {
    localStorage.Alliances = "{}"
}
if (!localStorage.events) {
    localStorage.events = "{}"
}
if (!localStorage.playoffList) {
    localStorage.playoffList = '{"Schedule":[]}'
}
if (!localStorage.qualsList) {
    localStorage.qualsList = '{"Schedule":[]}'
}
if (!localStorage.teamList) {
    localStorage.teamList = "[]"
}
if (!localStorage.eventName) {
    localStorage.eventName = ""
}
if (!localStorage.awardSeparator) {
    localStorage.awardSeparator = "<br>"
}
if (!localStorage.awardDepth) {
    localStorage.awardDepth = 3
}
if (!localStorage.showNotes) {
    localStorage.showNotes = "true"
}
if (!localStorage.showSponsors) {
    localStorage.showSponsors = "true"
}
if (!localStorage.showMottoes) {
    localStorage.showMottoes = "true"
}
if (!localStorage.showAwards) {
    localStorage.showAwards = "true"
}
if (!localStorage.showEventNames) {
    localStorage.showEventNames = "true"
}
if (!localStorage.showChampsStats) {
    localStorage.showChampsStats = "true"
}
if (!localStorage.offseason) {
    localStorage.offseason = "false"
}
if (!localStorage.eventFilters) {
    localStorage.eventFilters = JSON.stringify(["future"])
}
if (!localStorage.currentEventList) {
    localStorage.currentEventList = []
}
if (!localStorage.autoAdvance) {
    localStorage.autoAdvance = "false"
}

// reset some of those variables, which will be adjusted later.
localStorage.clock = "ready";
localStorage.matchHighScore = 0;
localStorage.highScoreDetails = "{}";

//This heartbeat performs a number of functions related to clocks. See the timer() function for details.
var matchTimer = setInterval(function () {
    "use strict";
    timer()
}, 1000);

//this heartbeat checks the world high scores every 5 minutes.
//var highScoresTimer = setInterval(function () {
//    "use strict";
//    getSeasonHighScores(2018);
//}, 300000);

//The apiURL determines the endpoint for API calls. 
var apiURL = "https://www.gatool.org/api/";

//Now that we have the variables all set up and all of the necessary JS and CSS are loaded, we can run the app.
var webAuth = new auth0.WebAuth({
    domain: 'gatool.auth0.com',
    clientID: 'afsE1dlAGS609U32NjmvNMaYSQmtO3NT',
    responseType: 'token id_token',
    audience: 'https://gatool.auth0.com/userinfo',
    scope: 'openid email profile',
    redirectUri: window.location.href
});

function handleAuthentication() {
    webAuth.parseHash(function (err, authResult) {
        if (authResult && authResult.accessToken && authResult.idToken) {
            localStorage.setItem('token', authResult.idToken);
            window.location.href = window.location.href.split('#')[0];
        } else if (err) {
            console.log(err);
            alert(
                'Error: ' + err.error + '. Check the console for further details.'
            );
        }
    });
}

window.onload = function () {
    "use strict";
    login();

    //hide the schedule progress bar. We'll show it if we need it.
    $('#scheduleProgressBar').hide();

    //change the Select Picker behavior to support Mobile browsers with native controls
    //if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
    //        $('.selectpicker').selectpicker('mobile');
    //    }
    $("#loadingFeedback").html("Restoring settings...");
    //Set the controls to the previous selected values
    //Set currentYear value
    if (localStorage.currentYear) {
        document.getElementById("yearPicker" + localStorage.currentYear).selected = !0;
        $("#yearPicker").selectpicker('refresh')
    }

    //Set awardSeparator value
    if (localStorage.awardSeparator === " || ") {
        document.getElementById("awardSeparator1").selected = !0
    } else if (localStorage.awardSeparator === " // ") {
        document.getElementById("awardSeparator2").selected = !0
    } else if (localStorage.awardSeparator === "<br>") {
        document.getElementById("awardSeparator3").selected = !0
    } else {
        localStorage.awardSeparator = "<br>";
        document.getElementById("awardSeparator3").selected = !0
    }
    $("#awardSeparatorPicker").selectpicker('refresh');

    //Set awardDepth value
    $("#awardDepthPicker").selectpicker('val', localStorage.awardDepth);

    //Set Event Filter values
    $("#eventFilters").selectpicker('val', JSON.parse(localStorage.eventFilters));

    $("#loadingFeedback").html("Enabling controls...");

    //Configure the yearPicker function
    document.getElementById('yearPicker').onchange = function () {
        localStorage.currentYear = $("#yearPicker").val();
        localStorage.removeItem("eventSelector");
        loadEventsList();
        initEnvironment()
    };

    //configure the Event Selector function
    document.getElementById('eventSelector').onchange = function () {
        handleEventSelection()
    };

    //Setup the switches on the Setup Screen
    $("[name='showSponsors']").bootstrapSwitch('state', (localStorage.showSponsors === "true"));
    $("[name='showAwards']").bootstrapSwitch('state', (localStorage.showAwards === "true"));
    $("[name='showNotes']").bootstrapSwitch('state', (localStorage.showNotes === "true"));
    $("[name='showMottoes']").bootstrapSwitch('state', (localStorage.showMottoes === "true"));
    $("[name='showEventNames']").bootstrapSwitch('state', (localStorage.showEventNames === "true"));
    $("[name='showChampsStats']").bootstrapSwitch('state', (localStorage.showChampsStats === "true"));
    $("[name='autoAdvance']").bootstrapSwitch('state', (localStorage.autoAdvance === "true"));
    $("[name='offseason']").bootstrapSwitch('state', (localStorage.offseason === "true"));
    $("[name='showRobotName']").bootstrapSwitch('state', true);
    $("[name='showRobotName']").bootstrapSwitch('size', 'mini');
    $("[name='showRobotName']").bootstrapSwitch('onText', 'Shown');
    $("[name='showRobotName']").bootstrapSwitch('offText', 'Hidden');

    //Ensure that the switch values are honored.
    // Handle Sponsors toggle during loading.
    if ($("#showSponsors").bootstrapSwitch('state')) {
        $(".sponsors").show()
    } else {
        $(".sponsors").hide()
    }

    // Handle Awards toggle during loading.
    if ($("#showAwards").bootstrapSwitch('state')) {
        $(".awards").show()
    } else {
        $(".awards").hide()
    }

    // Handle Notes toggle during loading.
    if ($("#showNotes").bootstrapSwitch('state')) {
        $(".notes").show()
    } else {
        $(".notes").hide()
    }

    // Handle Mottoes toggle during loading.
    if ($("#showMottoes").bootstrapSwitch('state')) {
        $(".mottoes").show()
    } else {
        $(".mottoes").hide()
    }

    // Handle Event Names toggle during loading.
    if ($("#showEventNames").bootstrapSwitch('state')) {
        localStorage.showEventNames = "true"
    } else {
        localStorage.showEventNames = "false"
    }
 // Handle Champs Stats toggle during loading.
 if ($("#showChampsStats").bootstrapSwitch('state')) {
    localStorage.showChampsStats = "true"
} else {
    localStorage.showChampsStats = "false"
}


    // Handle Auto Advance toggle during loading.
    if ($("#autoAdvance").bootstrapSwitch('state')) {
        localStorage.autoAdvance = "true"
    } else {
        localStorage.autoAdvance = "false"
    }

    // Handle Offseason toggle during loading. Hide and show offseason annotations in the Setup/Schedule display.
    if ($("#offseason").bootstrapSwitch('state')) {
        $(".offseason").show();
        $(".regularseason").hide()
    } else {
        $(".offseason").hide();
        $(".regularseason").show()
    }

    // Handle Sponsors toggle. Hide and show sponsors in the announce/PBP display.
    document.getElementById("showSponsors").onchange = function () {
        localStorage.showSponsors = $("#showSponsors").bootstrapSwitch('state');
        if ($("#showSponsors").bootstrapSwitch('state')) {
            $(".sponsors").show()
        } else {
            $(".sponsors").hide()
        }
    };

    // Handle Awards toggle. Hide and show awards in the announce/PBP display.
    document.getElementById("showAwards").onchange = function () {
        localStorage.showAwards = $("#showAwards").bootstrapSwitch('state');
        if ($("#showAwards").bootstrapSwitch('state')) {
            $(".awards").show()
        } else {
            $(".awards").hide()
        }
    };

    // Handle Notes toggle. Hide and show Notes in the announce/PBP display.
    document.getElementById("showNotes").onchange = function () {
        localStorage.showNotes = $("#showNotes").bootstrapSwitch('state');
        if ($("#showNotes").bootstrapSwitch('state')) {
            $(".notes").show()
        } else {
            $(".notes").hide()
        }
    };
    // Handle Mottoes toggle. Hide and show mottoes in the announce/PBP display.
    document.getElementById("showMottoes").onchange = function () {
        localStorage.showMottoes = $("#showMottoes").bootstrapSwitch('state');
        if ($("#showMottoes").bootstrapSwitch('state')) {
            $(".mottoes").show()
        } else {
            $(".mottoes").hide()
        }
    };

    //Handle offseason toggle. Hide and show regular season items and offseason items, accordingly.
    document.getElementById("offseason").onchange = function () {
        localStorage.offseason = $("#offseason").bootstrapSwitch('state');
        if ($("#offseason").bootstrapSwitch('state')) {
            $(".offseason").show();
            $(".regularseason").hide()
        } else {
            $(".offseason").hide();
            $(".regularseason").show()
        }
        localStorage.removeItem("eventSelector");
        loadEventsList()
    };

    //Handle a change in awards depth
    document.getElementById('awardDepthPicker').onchange = function () {
        localStorage.awardDepth = $("#awardDepthPicker").val();
        displayAwards()
    };

    //Handle a change in awards separator
    document.getElementById('awardSeparatorPicker').onchange = function () {
        if ($("#awardSeparatorPicker").val() === "||") {
            localStorage.awardSeparator = " || "
        } else if ($("#awardSeparatorPicker").val() === "//") {
            localStorage.awardSeparator = " // "
        } else {
            localStorage.awardSeparator = "<br>"
        }
        displayAwards()
    };

    //Handle a change in Event Name Display
    document.getElementById('showEventNames').onchange = function () {
        if ($("#showEventNames").bootstrapSwitch('state')) {
            localStorage.showEventNames = "true"
        } else {
            localStorage.showEventNames = "false"
        }
        displayAwards()
    };

    //Handle a change in Champs Stats Display
    document.getElementById('showChampsStats').onchange = function () {
        if ($("#showChampsStats").bootstrapSwitch('state')) {
            localStorage.showChampsStats = "true";
        } else {
            localStorage.showChampsStats = "false";
        }
        announceDisplay();
    };

    //Handle a change in autoAdvance
    document.getElementById('autoAdvance').onchange = function () {
        if ($("#autoAdvance").bootstrapSwitch('state')) {
            localStorage.autoAdvance = "true"
        } else {
            localStorage.autoAdvance = "false"
        }
    };

    //Handle Event Filter change
    //document.getElementById('eventFilters').onchange = function () {
    //    filterEvents()
    //};

    $("#loadingFeedback").html("Setting up offseason mode...");

    //Setup the Offseason schedule upload and reset buttons. See their respective fuctions for details.
    document.getElementById("QualsFiles").addEventListener('change', handleQualsFiles, !1);
    document.getElementById("PlayoffFiles").addEventListener('change', handlePlayoffFiles, !1);
    document.getElementById("QualsFilesReset").addEventListener('click', handleQualsFilesReset, !1);
    document.getElementById("PlayoffFilesReset").addEventListener('click', handlePlayoffFilesReset, !1);

    //setup the Offseason Tab
    $('#offseasonTeamListToJSON').click(function () {
        //Example: var parseOutput = CSVParser.parse(this.inputText, this.headersProvided, this.delimiter, this.downcaseHeaders, this.upcaseHeaders);
        //console.log("starting conversion");
        var inbound = $("#offSeasonTeamListInput").val();
        var outbound = CSVParser.parse(inbound, !0, "auto", !1, !1);
        if (outbound.errors) {
            alert("Errors in the input:\n" + outbound.errors)
        } else {
            //Example: jsonResult = JSON.parse(toJSON(outbound.dataGrid,outbound.headerNames,outbound.headerTypes,""));
            localStorage.teamList = toJSON(outbound.dataGrid, outbound.headerNames, outbound.headerTypes, "");
            eventTeamList = JSON.parse(localStorage.teamList);
            alert("Converted Result:\n" + localStorage.teamList);
            updateTeamTable()
        }
    });

    //Add the image to the cheat sheet. We do this late so that other items will load first.
    $('#cheatSheetImage').html('<img src="images/deep_space_cheat_sheet.png" width="100%" alt="Cheatsheet">');
    $('#allianceSelectionTable').hide();
    $('#allianceUndoButton').hide();

    //Load the events list based on the restored values
    loadEventsList();

    window.addEventListener("resize", scaleRows);

    document.addEventListener('keyup', handleKeyboardNav);

    $("input, #awardsUpdate, #sponsorsUpdate, #topSponsorsUpdate").on("focus", deactivateKeys);
    $("input, #awardsUpdate, #sponsorsUpdate, #topSponsorsUpdate").on("blur", activateKeys);

    scaleRows();
    document.getElementById('setupTabPicker').click();
    $("#loadingFeedback").html("gatool ready to play!");
    $("#loadingFeedback").fadeOut();
};

function deactivateKeys(event) {
    document.removeEventListener('keyup', handleKeyboardNav);
}

function activateKeys(event) {
    document.addEventListener('keyup', handleKeyboardNav);
}

function handleKeyboardNav(event) {
    if (event.defaultPrevented) {
        return;
    }
    var key = event.key || event.keyCode;
    if (key === 'ArrowRight' || key === 'd' || key === 39 || key === 68) {
        getNextMatch();
    }
    if (key === 'ArrowLeft' || key === 'a' || key === 37 || key === 65) {
        getPreviousMatch();
    }
    if (key === 'ArrowUp' || key === 'w' || key === 38 || key === 87) {
        getNextTab();
    }
    if (key === 'ArrowDown' || key === 's' || key === 40 || key === 83) {
        getPreviousTab();
    }

}

function login() {
    "use strict";
    if (window.location.hash) {
        handleAuthentication();
    } else {
        const token = "Bearer " + localStorage.getItem("token");
        if (token === null || token === "") {
            webAuth.authorize();
        } else {
            try {
                var parsedToken = parseJwt(token);
                var date = new Date(0);
                date.setUTCSeconds(parsedToken.exp);
                var expired = !(date.valueOf() > new Date().valueOf());
                if (expired) {
                    webAuth.authorize();
                }
            } catch (e) {
                webAuth.authorize();
            }
        }
    }
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
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
                localStorage.removeItem("token");
                webAuth.logout({ returnTo: window.location.href });
            }
        }]
    });
}

function displayAwards() {
    "use strict";
    //Handle awardSeparator value
    $(".awardsSeparator1,.awardsSeparator2,.awardsSeparator3").hide();
    if (localStorage.awardSeparator === " || ") {
        $(".awardsSeparator1").show()
    } else if (localStorage.awardSeparator === " // ") {
        $(".awardsSeparator2").show()
    } else if (localStorage.awardSeparator === "<br>") {
        $(".awardsSeparator3").show()
    } else {
        $(".awardsSeparator3").show()
    }

    //Handle awardDepth value
    $(".awardsDepth1,.awardsDepth2,.awardsDepth3").show();
    $(".lastAward1,.lastAward2,.lastAward3").hide();
    if (localStorage.awardDepth === "1") {
        $(".awardsDepth2,.awardsDepth3").hide()
    } else if (localStorage.awardDepth === "2") {
        $(".awardsDepth3").hide();
        $(".lastAward1").show()
    } else {
        $(".lastAward1,.lastAward2").show()
    }

    //Handle Event Names switch
    if (localStorage.showEventNames === "true") {
        $(".awardsEventName").show();
        $(".awardsEventCode").hide()
    } else {
        $(".awardsEventName").hide();
        $(".awardsEventCode").show()
    }
}

function initEnvironment() {
    "use strict";
    localStorage.currentMatch = 1;
    localStorage.inPlayoffs = "false";
    localStorage.Alliances = "{}";
    localStorage.events = "{}";
    localStorage.playoffList = '{"Schedule":[]}';
    localStorage.qualsList = '{"Schedule":[]}';
    localStorage.teamList = "[]";
    localStorage.clock = "ready";
    localStorage.matchHighScore = 0;
    localStorage.highScoreDetails = "{}";
    localStorage.allianceNoChange = "false";
    localStorage.showEventNames = "true";
    localStorage.showChampsStats = "true";
    playoffResults = {};
    playoffResultsDetails = {};
    allianceTeamList = [];
    allianceListUnsorted = [];
    declinedList = [];
    backupAllianceList = [];
    declinedListUndo = [];
    backupAllianceListUndo = [];
    undoCounter = [];
    eventAppearances = {};
    champsAwards = {};
    allianceSelectionLength = 15;
    rankingsList = [];
    districtRankings = {};
    currentAllianceChoice = 0;
    teamLoadProgressBar = 0;
    teamAwardCalls = 0;
    teamUpdateCalls = 0;
    teamCountTotal = 0;
    lastSchedulePage = !1;
    haveRanks = !1;
    haveSchedule = !1;
    $('#ranksContainer').html("No Rankings available.");
    $('#allianceSelectionTable').hide();
    $('#allianceUndoButton').hide();
    $("#davidPriceNumber").html("No Sched");
    $("#davidPriceAlliances").hide();
    $("#playoffBracket").hide();
    $(".playoffCells").html("TBD");
    $(".playoffBadge").removeClass("redScore blueScore tieScore greyScore");
    $("#allianceBracket").html("Alliance Selection");
}

function prepareAllianceSelection() {
    "use strict";
    allianceTeamList = [];
    allianceListUnsorted = [];
    declinedList = [];
    backupAllianceList = [];
    declinedListUndo = [];
    backupAllianceListUndo = [];
    undoCounter = [];
    rankingsList = [];
    districtRankings = {};
    currentAllianceChoice = 0;
    $("#allianceSelectionTable").html('<table> <tr> <td><table class="availableTeams"> <tr> <td colspan="5"><strong>Teams for Alliance Selection</strong></td></tr><tr> <td id="allianceTeamList1" class="col1"><div class="allianceTeam">List of teams</div></td><td id="allianceTeamList2" class="col1"><div class="allianceTeam">List of teams</div></td><td id="allianceTeamList3" class="col1"><div class="allianceTeam">List of teams</div></td><td id="allianceTeamList4" class="col1"><div class="allianceTeam">List of teams</div></td><td id="allianceTeamList5" class="col1"><div class="allianceTeam allianceCaptain">List of teams</div></td></tr></table></td><td class="col1"><table id="backupTeamsTable" class="backupAlliancesTable"> <tr> <td><p><strong>Backup Alliances</strong><br>(Initially rank 9 to 16 top to bottom)</p></td></tr><tr> <td><div class="allianceTeam" id="backupAllianceTeam1">List of teams</div></td></tr><tr> <td><div class="allianceTeam" id="backupAllianceTeam2">List of teams</div></td></tr><tr> <td><div class="allianceTeam" id="backupAllianceTeam3">List of teams</div></td></tr><tr> <td><div class="allianceTeam" id="backupAllianceTeam4">List of teams</div></td></tr><tr> <td><div class="allianceTeam" id="backupAllianceTeam5">List of teams</div></td></tr><tr> <td><div class="allianceTeam" id="backupAllianceTeam6">List of teams</div></td></tr><tr> <td><div class="allianceTeam" id="backupAllianceTeam7">List of teams</div></td></tr><tr> <td><div class="allianceTeam" id="backupAllianceTeam8">List of teams</div></td></tr></table></td><td><table class="alliancesTeamsTable"> <tr class="col6"> <td id="Alliance1" class="col3 dropzone"><div class="alliancedrop" id="Alliance1Captain">Alliance 1 Captain</div><div class="alliancedrop nextAllianceChoice" id="Alliance1Round1" >Alliance 1 first choice</div><div class="alliancedrop" id="Alliance1Round2" >Alliance 1 second choice</div><div class="alliancedrop thirdAllianceSelection" id="Alliance1Round3" >Alliance 1 third choice</div></td><td id="Alliance8" class="col3"><div class="alliancedrop" id="Alliance8Captain" >Alliance 8 Captain</div><div class="alliancedrop" id="Alliance8Round1" >Alliance 8 first choice</div><div class="alliancedrop" id="Alliance8Round2" >Alliance 8 second choice</div><div class="alliancedrop thirdAllianceSelection" id="Alliance8Round3" >Alliance 8 third choice</div></td></tr><tr class="col6"> <td id="Alliance2" class="col3"><div class="alliancedrop" id="Alliance2Captain" >Alliance 2 Captain</div><div class="alliancedrop" id="Alliance2Round1" >Alliance 2 first choice</div><div class="alliancedrop" id="Alliance2Round2" >Alliance 2 second choice</div><div class="alliancedrop thirdAllianceSelection" id="Alliance2Round3" >Alliance 2 third choice</div></td><td id="Alliance7" class="col3"><div class="alliancedrop" id="Alliance7Captain" >Alliance 7 Captain</div><div class="alliancedrop" id="Alliance7Round1" >Alliance 7 first choice</div><div class="alliancedrop" id="Alliance7Round2" >Alliance 7 second choice</div><div class="alliancedrop thirdAllianceSelection" id="Alliance7Round3" >Alliance 7 third choice</div></td></tr><tr class="col6"> <td id="Alliance3" class="col3"><div class="alliancedrop" id="Alliance3Captain" >Alliance 3 Captain</div><div class="alliancedrop" id="Alliance3Round1" >Alliance 3 first choice</div><div class="alliancedrop" id="Alliance3Round2" >Alliance 3 second choice</div><div class="alliancedrop thirdAllianceSelection" id="Alliance3Round3" >Alliance 3 third choice</div></td><td id="Alliance6" class="col3"><div class="alliancedrop" id="Alliance6Captain" >Alliance 6 Captain</div><div class="alliancedrop" id="Alliance6Round1" >Alliance 6 first choice</div><div class="alliancedrop" id="Alliance6Round2" >Alliance 6 second choice</div><div class="alliancedrop thirdAllianceSelection" id="Alliance6Round3" >Alliance 6 third choice</div></td></tr><tr class="col6"> <td id="Alliance4" class="col3"><div class="alliancedrop" id="Alliance4Captain" >Alliance 4 Captain</div><div class="alliancedrop" id="Alliance4Round1" >Alliance 4 first choice</div><div class="alliancedrop" id="Alliance4Round2" >Alliance 4 second choice</div><div class="alliancedrop thirdAllianceSelection" id="Alliance4Round3" >Alliance 4 third choice</div></td><td id="Alliance5" class="col3"><div class="alliancedrop" id="Alliance5Captain" >Alliance 5 Captain</div><div class="alliancedrop" id="Alliance5Round1" >Alliance 5 first choice</div><div class="alliancedrop" id="Alliance5Round2" >Alliance 5 second choice</div><div class="alliancedrop thirdAllianceSelection" id="Alliance5Round3" >Alliance 5 third choice</div></td></tr></table></td></tr></table>')
}

function handleEventSelection() {
    "use strict";
    $('#scheduleProgressBar').show();
    $('#scheduleContainer').html('No schedule available for this event.');
    $('#scheduleTabPicker').addClass('alert-danger');
    $('#ranksProgressBar').hide();
    $('#ranksContainer').html("No Rankings available.");
    $('#teamRanksPicker').addClass('alert-danger');
    $('#allianceInfo').show();
    $('#allianceSelectionTable').hide();
    $('#allianceUndoButton').hide();
    $("#allianceSelectionTabPicker").addClass("alert-danger");
    $("#teamloadprogress").show();
    $("#QualsFiles").show();
    $("#PlayoffFiles").show();
    $("#QualsFilesReset").hide();
    $("#PlayoffFilesReset").hide();
    $("#davidPriceNumber").html("No Sched");
    $("#davidPriceAlliances").hide();
    $("#allianceBracket").html("Alliance Selection");
    clearFileInput("QualsFiles");
    clearFileInput("PlayoffFiles");
    document.getElementById("QualsFiles").addEventListener('change', handleQualsFiles, !1);
    document.getElementById("PlayoffFiles").addEventListener('change', handlePlayoffFiles, !1);

    eventTeamList = [];
    haveRanks = !1;
    haveSchedule = !1;
    eventQualsSchedule = [];
    eventPlayoffSchedule = [];
    localStorage.currentMatch = 1;
    localStorage.playoffList = '{"Schedule":[]}';
    localStorage.qualsList = '{"Schedule":[]}';
    localStorage.eventDistrict = "";
    lastRanksUpdate = "";
    lastQualsUpdate = "";
    qualsComplete = !1;
    allianceSelectionReady = !1;
    lastSchedulePage = !1;
    teamLoadProgressBar = 0;
    teamCountTotal = 0;
    currentMatchData = {};
    allianceSelectionTableUndo = [];
    lastMatchPlayed = 0;
    lastPlayoffMatchPlayed = 0;
    teamUpdateCalls = 0;
    teamAwardCalls = 0;
    showAllianceSelectionOverride = false;
    playoffResultsDetails = {};
    playoffResults = {};
    eventAppearances = {};
    champsAwards = {};
    var e = document.getElementById('eventSelector');
    var data = JSON.parse(e.value);
    localStorage.eventSelector = data.code;
    localStorage.currentEvent = data.code;

    $('#eventCodeContainer').html(data.code);
    $('#districtCodeContainer').html(data.districtCode || "Regional Event");
    $('#eventLocationContainer').html(data.venue + "" + " in " + data.city + ", " + data.stateprov + " " + data.country);
    var startDate = moment(data.dateStart, 'YYYY-MM-DDTHH:mm:ss').format('dddd, MMMM Do');
    var endDate = moment(data.dateEnd, 'YYYY-MM-DDTHH:mm:ss').format('dddd, MMMM Do, YYYY');
    $("#eventDateContainer").html(startDate + " to " + endDate);
    $('#announceBanner').show();
    $('#announceDisplay').hide();
    $('#playByPlayBanner').show();
    $('#playByPlayDisplay').hide();
    $("#eventName").html('<span class="loadingEvent"><b>Waiting for event schedule... Team Data available.</b></span>');
    localStorage.eventName = data.name;
    if (data.districtCode !== null) {
        localStorage.eventDistrict = data.districtCode;
    }
    localStorage.teamList = "[]";
    if (inChamps() || inSubdivision()) {
        allianceSelectionLength = 23
    } else {
        allianceSelectionLength = 15
    }
    getTeamList(localStorage.currentYear);
    localStorage.matchHighScore = 0;
    localStorage.highScoreDetails = "{}";
    $("#eventName").html("<b>" + JSON.parse(document.getElementById("eventSelector").value).name + "</b>");
    $("#eventNameAllianceSelection").html("<b>" + localStorage.eventName + " </b>");
    $("#eventNamePlayoffBracket").html(localStorage.eventName);
    $("#eventNameAwards").html("<b>" + localStorage.eventName + "</b><br>")
    $("#playoffBracket").hide();
    $(".playoffCells").html("TBD");
    $(".playoffBadge").removeClass("redScore blueScore tieScore greyScore");
}

function handleOffseasonEventSelection() {
    "use strict";
    $('#scheduleProgressBar').show();
    $('#scheduleContainer').html('No schedule available for this event.');
    $('#scheduleTabPicker').addClass('alert-danger');
    $('#ranksProgressBar').hide();
    $('#ranksContainer').html("No Rankings available.");
    $('#teamRanksPicker').addClass('alert-danger');
    $('#allianceSelectionTable').hide();
    $('#allianceUndoButton').hide();
    $("#allianceSelectionTabPicker").addClass("alert-danger");
    $("#teamloadprogress").show();
    $("#davidPriceNumber").html("No Sched");
    $("#davidPriceAlliances").hide();
    eventTeamList = [];
    eventQualsSchedule = [];
    eventPlayoffSchedule = [];
    localStorage.currentMatch = 1;
    localStorage.playoffList = '{"Schedule":[]}';
    localStorage.qualsList = '{"Schedule":[]}';
    allianceSelectionReady = !1;
    var data = JSON.parse(localStorage.offseasonEventData);
    localStorage.eventSelector = "offseason";
    localStorage.currentEvent = "offseason";
    $('#eventCodeContainer').html(data.code);
    $('#eventLocationContainer').html(data.venue + "" + " in " + data.city + ", " + data.stateprov + " " + data.country);
    var startDate = moment(data.dateStart, 'YYYY-MM-DDTHH:mm:ss').format('dddd, MMMM Do');
    var endDate = moment(data.dateEnd, 'YYYY-MM-DDTHH:mm:ss').format('dddd, MMMM Do, YYYY');
    $("#eventDateContainer").html(startDate + " to " + endDate);
    $('#announceBanner').show();
    $('#announceDisplay').hide();
    $('#playByPlayBanner').show();
    $('#playByPlayDisplay').hide();
    $("#eventName").html('<span class="loadingEvent"><b>Waiting for event schedule... Team Data available.</b></span>');
    localStorage.eventName = data.name;
    localStorage.teamList = "[]";
    if (inChamps() || inSubdivision()) {
        allianceSelectionLength = 23
    } else {
        allianceSelectionLength = 15
    }
    getTeamList(localStorage.currentYear);
    localStorage.matchHighScore = 0;
    localStorage.highScoreDetails = "{}";
    $("#eventName").html("<b>" + JSON.parse(document.getElementById("eventSelector").value).name + "</b>");
    $("#eventNameAllianceSelection").html("<b>" + localStorage.eventName + "<br>");
    $("#eventNameAwards").html("<b>" + localStorage.eventName + "</b><br>")
}

function loadEventsList() {
    "use strict";
    var e = document.getElementById('yearPicker');
    localStorage.currentYear = e.options[e.selectedIndex].value;
    $("#eventUpdateContainer").html("Loading event list...");
    var req = new XMLHttpRequest();
    var endpoint = "/events";
    if (localStorage.offseason === "true") {
        endpoint = "/offseasoneventsv2"
    }
    req.open('GET', apiURL + localStorage.currentYear + endpoint);
    req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req.addEventListener('load', function () {
        if (req.status === 200) {
            localStorage.currentEventList = JSON.stringify(JSON.parse(req.responseText).Events);
            currentEventList = JSON.parse(req.responseText).Events;
            

        } else if (req.status===500) {
           currentEventList = JSON.parse('[{"code":"ABCA","divisionCode":null,"name":"Canadian Rockies Regional","type":"Regional","districtCode":null,"venue":"Genesis Centre","address":"#10, 7555 Falconridge Blvd NE","city":"Calgary","stateprov":"AB","country":"Canada","website":"http://frcwest.com/","webcasts":[],"timezone":"Mountain Standard Time","dateStart":"2019-04-04T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"ALHU","divisionCode":null,"name":"Rocket City Regional","type":"Regional","districtCode":null,"venue":"Von Braun Center","address":"700 Monroe Street SW","city":"Huntsville","stateprov":"AL","country":"USA","website":"http://firstinalabama.org/events/frc-events/","webcasts":["https://www.twitch.tv/firstinspires9","https://www.twitch.tv/firstinspires10"],"timezone":"Central Standard Time","dateStart":"2019-03-14T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"ARCHIMEDES","divisionCode":"ARDA","name":"FIRST Championship - Detroit - Archimedes Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"Cobo Center","address":"1 Washington Boulevard","city":"Detroit","stateprov":"MI","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_archimedes"],"timezone":"Eastern Standard Time","dateStart":"2019-04-25T00:00:00","dateEnd":"2019-04-28T23:59:59"},{"code":"ARDA","divisionCode":"CMPMI","name":"FIRST Championship - Detroit - ARDA Division","type":"ChampionshipDivision","districtCode":null,"venue":"Cobo Center","address":"1 Washington Boulevard","city":"Detroit","stateprov":"MI","country":"USA","website":null,"webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-25T00:00:00","dateEnd":"2019-04-28T23:59:59"},{"code":"ARLI","divisionCode":null,"name":"Arkansas Rock City Regional","type":"Regional","districtCode":null,"venue":"Arkansas State Fairgrounds - Barton Coliseum","address":"Barton Coliseum 2600 Howard Street","city":"Little Rock","stateprov":"AR","country":"USA","website":"http://arfirst.org","webcasts":["https://www.twitch.tv/firstinspires1","https://www.twitch.tv/firstinspires2"],"timezone":"Central Standard Time","dateStart":"2019-03-07T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"AUSC","divisionCode":null,"name":"Southern Cross Regional","type":"Regional","districtCode":null,"venue":"Quaycentre at Sydney Olympic Park","address":"Olympic Boulevard","city":"Sydney Olympic Park","stateprov":"NSW","country":"Australia","website":"https://firstaustralia.org/","webcasts":[],"timezone":"AUS Eastern Standard Time","dateStart":"2019-03-10T00:00:00","dateEnd":"2019-03-13T23:59:59"},{"code":"AUSP","divisionCode":null,"name":"South Pacific Regional","type":"Regional","districtCode":null,"venue":"Quaycentre at Sydney Olympic Park","address":"Olympic Boulevard","city":"Sydney Olympic Park","stateprov":"NSW","country":"Australia","website":"https://firstaustralia.org/","webcasts":[],"timezone":"AUS Eastern Standard Time","dateStart":"2019-03-16T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"AZFL","divisionCode":null,"name":"Arizona North Regional","type":"Regional","districtCode":null,"venue":"J. Lawrence Walkup Skydome - Northern Arizona University","address":"1701 S. San Francisco Street","city":"Flagstaff","stateprov":"AZ","country":"USA","website":"https://www.nau.edu/robotics","webcasts":["https://www.twitch.tv/firstinspires11","https://www.twitch.tv/firstinspires12"],"timezone":"US Mountain Standard Time","dateStart":"2019-03-07T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"AZPX","divisionCode":null,"name":"Arizona West Regional","type":"Regional","districtCode":null,"venue":"Grand Canyon University Arena","address":"3300 W. Camelback Road","city":"Phoenix","stateprov":"AZ","country":"USA","website":"http://www.azfirst.org/","webcasts":["https://www.twitch.tv/firstinspires9","https://www.twitch.tv/firstinspires10"],"timezone":"US Mountain Standard Time","dateStart":"2019-04-04T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"AZTEM","divisionCode":null,"name":"Sanghi Foundation FIRST Robotics Competition Arizona State Championship","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Wells Fargo Arena, Arizona State University","address":"600 E Veterans Way","city":"Tempe","stateprov":"AZ","country":"USA","website":null,"webcasts":[],"timezone":"Mountain Standard Time","dateStart":"2019-10-13T00:00:00","dateEnd":"2019-10-13T23:59:59"},{"code":"BC19","divisionCode":null,"name":"BattleCry 19","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Worcester Polytechnic Institute","address":"100 Institute Rd","city":"Worcester","stateprov":"MA","country":"USA","website":"https://web.wpi.edu/news/Events/BattleCry/index.html","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-05-18T00:00:00","dateEnd":"2019-05-20T23:59:59"},{"code":"BCVI","divisionCode":null,"name":"Canadian Pacific Regional","type":"Regional","districtCode":null,"venue":"Save on Foods Memorial Centre","address":"1925 Blanshard Street","city":"Victoria","stateprov":"BC","country":"Canada","website":null,"webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-03-13T00:00:00","dateEnd":"2019-03-16T23:59:59"},{"code":"CAAV","divisionCode":null,"name":"Aerospace Valley Regional","type":"Regional","districtCode":null,"venue":"Eastside High School","address":"3200 E Ave J 8","city":"Lancaster","stateprov":"CA","country":"USA","website":"https://www.avregional.org/","webcasts":["https://www.twitch.tv/firstinspires11","https://www.twitch.tv/firstinspires12"],"timezone":"Pacific Standard Time","dateStart":"2019-04-04T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"CADA","divisionCode":null,"name":"Sacramento Regional","type":"Regional","districtCode":null,"venue":"UC Davis ARC Pavilion","address":"Corner of Orchard and LaRue","city":"Davis","stateprov":"CA","country":"USA","website":"http://www.firstsac.org","webcasts":["https://www.twitch.tv/firstinspires13","https://www.twitch.tv/firstinspires14"],"timezone":"Pacific Standard Time","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"CAFR","divisionCode":null,"name":"Central Valley Regional","type":"Regional","districtCode":null,"venue":"Fresno Convention & Entertainment Center","address":"848 M Street","city":"Fresno","stateprov":"CA","country":"USA","website":"http://www.centralvalleyregional.org","webcasts":["https://www.twitch.tv/firstinspires13","https://www.twitch.tv/firstinspires14"],"timezone":"Pacific Standard Time","dateStart":"2019-04-05T00:00:00","dateEnd":"2019-04-08T23:59:59"},{"code":"CAIR","divisionCode":null,"name":"Orange County Regional","type":"Regional","districtCode":null,"venue":"University of California, Irvine","address":"Bren Events Center 100 Bren Events Center","city":"Irvine","stateprov":"CA","country":"USA","website":"http://www.firstoc.org/","webcasts":["https://www.twitch.tv/firstinspires11","https://www.twitch.tv/firstinspires12"],"timezone":"Pacific Standard Time","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"CANE","divisionCode":"CMPTX","name":"FIRST Championship - Houston - CANE Division","type":"ChampionshipDivision","districtCode":null,"venue":"George R. Brown Convention Center","address":"1001 Avenida De Las Americas","city":"Houston","stateprov":"TX","country":"USA","website":null,"webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-04-18T00:00:00","dateEnd":"2019-04-21T23:59:59"},{"code":"CAPO","divisionCode":null,"name":"Los Angeles Regional","type":"Regional","districtCode":null,"venue":"Fairplex","address":"1101 W. McKinley Avenue","city":"Pomona","stateprov":"CA","country":"USA","website":"http://www.firstlaregional.com","webcasts":["https://www.twitch.tv/firstinspires11","https://www.twitch.tv/firstinspires12"],"timezone":"Pacific Standard Time","dateStart":"2019-03-14T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"CARSON","divisionCode":"CATE","name":"FIRST Championship - Detroit - Carson Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"Cobo Center","address":"1 Washington Boulevard","city":"Detroit","stateprov":"MI","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_carson"],"timezone":"Eastern Standard Time","dateStart":"2019-04-25T00:00:00","dateEnd":"2019-04-28T23:59:59"},{"code":"CARVER","divisionCode":"CANE","name":"FIRST Championship - Houston - Carver Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"George R. Brown Convention Center","address":"1001 Avenida De Las Americas","city":"Houston","stateprov":"TX","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_carver"],"timezone":"Central Standard Time","dateStart":"2019-04-18T00:00:00","dateEnd":"2019-04-21T23:59:59"},{"code":"CASD","divisionCode":null,"name":"San Diego Regional presented by Qualcomm","type":"Regional","districtCode":null,"venue":"Del Mar Fairgrounds Arena Complex","address":"2260 Jimmy Durante Blvd","city":"Del Mar","stateprov":"CA","country":"USA","website":"http://sandiegoregional.com/","webcasts":["https://www.twitch.tv/firstinspires13","https://www.twitch.tv/firstinspires14"],"timezone":"Pacific Standard Time","dateStart":"2019-03-07T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"CASF","divisionCode":null,"name":"San Francisco Regional","type":"Regional","districtCode":null,"venue":"St. Ignatius College Preparatory","address":"2001 37th Avenue","city":"San Francisco","stateprov":"CA","country":"USA","website":"http://www.firstsfbay.org","webcasts":["https://www.twitch.tv/firstinspires13","https://www.twitch.tv/firstinspires14"],"timezone":"Pacific Standard Time","dateStart":"2019-03-15T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"CASJ","divisionCode":null,"name":"Silicon Valley Regional","type":"Regional","districtCode":null,"venue":"San Jose State University - The Event Center","address":"290 South 7th Street","city":"San Jose","stateprov":"CA","country":"USA","website":"http://www.firstsv.org","webcasts":["https://www.twitch.tv/firstinspires9","https://www.twitch.tv/firstinspires10"],"timezone":"Pacific Standard Time","dateStart":"2019-03-28T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"CATE","divisionCode":"CMPMI","name":"FIRST Championship - Detroit - CATE Division","type":"ChampionshipDivision","districtCode":null,"venue":"Cobo Center","address":"1 Washington Boulevard","city":"Detroit","stateprov":"MI","country":"USA","website":null,"webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-25T00:00:00","dateEnd":"2019-04-28T23:59:59"},{"code":"CAVE","divisionCode":null,"name":"Ventura Regional","type":"Regional","districtCode":null,"venue":"Ventura College","address":"4667 Telegraph Road","city":"Ventura","stateprov":"CA","country":"USA","website":"http://www.frcventuraregional.com/","webcasts":["https://www.twitch.tv/firstinspires11","https://www.twitch.tv/firstinspires12"],"timezone":"Pacific Standard Time","dateStart":"2019-03-28T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"CHCMP","divisionCode":null,"name":"FIRST Chesapeake District Championship","type":"DistrictChampionship","districtCode":"CHS","venue":"University of Maryland","address":"Xfinity Center 8500 Paint Branch Drive","city":"College Park","stateprov":"MD","country":"USA","website":"http://www.firstchesapeake.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-28T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"CMPMI","divisionCode":null,"name":"FIRST Championship - Detroit","type":"Championship","districtCode":null,"venue":"Cobo Center","address":"1 Washington Boulevard","city":"Detroit","stateprov":"MI","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires","https://www.twitch.tv/firstinspires1"],"timezone":"Eastern Standard Time","dateStart":"2019-04-25T00:00:00","dateEnd":"2019-04-28T23:59:59"},{"code":"CMPTX","divisionCode":null,"name":"FIRST Championship - Houston","type":"Championship","districtCode":null,"venue":"George R. Brown Convention Center","address":"1001 Avenida De Las Americas","city":"Houston","stateprov":"TX","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires","https://www.twitch.tv/firstinspires1"],"timezone":"Central Standard Time","dateStart":"2019-04-18T00:00:00","dateEnd":"2019-04-21T23:59:59"},{"code":"CODE","divisionCode":null,"name":"Colorado Regional","type":"Regional","districtCode":null,"venue":"University of Denver - Daniel L. Ritchie Center","address":"2201 East Asbury Ave","city":"Denver","stateprov":"CO","country":"USA","website":"http://coloradofirst.org/COFIRST/programs/frc/colorado-regional/","webcasts":["https://www.twitch.tv/firstinspires7","https://www.twitch.tv/firstinspires8"],"timezone":"Mountain Standard Time","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"CTHAR","divisionCode":null,"name":"NE District Hartford Event","type":"DistrictEvent","districtCode":"NE","venue":"Hartford Public High School","address":"55 Forest Street","city":"Hartford","stateprov":"CT","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-06T00:00:00","dateEnd":"2019-04-08T23:59:59"},{"code":"CTSCT","divisionCode":null,"name":"NE District Southern CT Event","type":"DistrictEvent","districtCode":"NE","venue":"Fairfield University","address":"1073 N Benson Road","city":"Fairfield","stateprov":"CT","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-16T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"CTWAT","divisionCode":null,"name":"NE District Waterbury Event","type":"DistrictEvent","districtCode":"NE","venue":"Wilby High School","address":"460 Buck Hill Road","city":"Waterbury","stateprov":"CT","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-09T00:00:00","dateEnd":"2019-03-11T23:59:59"},{"code":"CUDA","divisionCode":"CMPMI","name":"FIRST Championship - Detroit - CUDA Division","type":"ChampionshipDivision","districtCode":null,"venue":"Cobo Center","address":"1 Washington Boulevard","city":"Detroit","stateprov":"MI","country":"USA","website":null,"webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-25T00:00:00","dateEnd":"2019-04-28T23:59:59"},{"code":"CURIE","divisionCode":"CUDA","name":"FIRST Championship - Detroit - Curie Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"Cobo Center","address":"1 Washington Boulevard","city":"Detroit","stateprov":"MI","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_curie"],"timezone":"Eastern Standard Time","dateStart":"2019-04-25T00:00:00","dateEnd":"2019-04-28T23:59:59"},{"code":"DALY","divisionCode":"ARDA","name":"FIRST Championship - Detroit - Daly Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"Cobo Center","address":"1 Washington Boulevard","city":"Detroit","stateprov":"MI","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_daly"],"timezone":"Eastern Standard Time","dateStart":"2019-04-25T00:00:00","dateEnd":"2019-04-28T23:59:59"},{"code":"DARWIN","divisionCode":"CUDA","name":"FIRST Championship - Detroit - Darwin Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"Cobo Center","address":"1 Washington Boulevard","city":"Detroit","stateprov":"MI","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_darwin"],"timezone":"Eastern Standard Time","dateStart":"2019-04-25T00:00:00","dateEnd":"2019-04-28T23:59:59"},{"code":"FLOR","divisionCode":null,"name":"Orlando Regional","type":"Regional","districtCode":null,"venue":"CFE Arena at the University of Central Florida","address":"12777 Gemini Blvd N","city":"Orlando","stateprov":"FL","country":"USA","website":"http://orlandofrc.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-07T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"FLWP","divisionCode":null,"name":"South Florida Regional ","type":"Regional","districtCode":null,"venue":"Palm Beach Convention Center","address":"650 Okeechobee Blvd","city":"West Palm Beach","stateprov":"FL","country":"USA","website":"http://firstinflorida.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-28T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"GAALB","divisionCode":null,"name":"PCH District Albany Event","type":"DistrictEvent","districtCode":"PCH","venue":"Albany Civic Center","address":"100 W. Oglethorpe Blvd","city":"Albany","stateprov":"GA","country":"USA","website":"http://www.gafirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-15T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"GACMP","divisionCode":null,"name":"Peachtree District State Championship","type":"DistrictChampionship","districtCode":"PCH","venue":"University of Georgia - Stegeman Coliseum","address":"100 Smith Street","city":"Athens","stateprov":"GA","country":"USA","website":"http://www.gafirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-04T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"GACOL","divisionCode":null,"name":"PCH District Columbus Event","type":"DistrictEvent","districtCode":"PCH","venue":"Columbus State University - Lumpkin Center","address":"4225 University Avenue","city":"Columbus","stateprov":"GA","country":"USA","website":"http://www.gafirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-22T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"GADAL","divisionCode":null,"name":"PCH District Dalton Event","type":"DistrictEvent","districtCode":"PCH","venue":"Dalton Convention Center","address":"2211 Dug Gap Battle Road","city":"Dalton","stateprov":"GA","country":"USA","website":"http://www.gafirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-08T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"GADUL","divisionCode":null,"name":"PCH District Duluth Event","type":"DistrictEvent","districtCode":"PCH","venue":"Infinite Energy Arena","address":"6400 Sugarloaf Parkway","city":"Duluth","stateprov":"GA","country":"USA","website":"http://gafirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"GAGAI","divisionCode":null,"name":"PCH District Gainesville Event","type":"DistrictEvent","districtCode":"PCH","venue":"Riverside Military Academy - Field House","address":"2001 Riverside Drive","city":"Gainesville","stateprov":"GA","country":"USA","website":"http://www.gafirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-02T00:00:00","dateEnd":"2019-03-04T23:59:59"},{"code":"GALILEO","divisionCode":"GARO","name":"FIRST Championship - Houston - Galileo Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"George R. Brown Convention Center","address":"1001 Avenida De Las Americas","city":"Houston","stateprov":"TX","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_galileo"],"timezone":"Central Standard Time","dateStart":"2019-04-18T00:00:00","dateEnd":"2019-04-21T23:59:59"},{"code":"GARO","divisionCode":"CMPTX","name":"FIRST Championship - Houston - GARO Division","type":"ChampionshipDivision","districtCode":null,"venue":"George R. Brown Convention Center","address":"1001 Avenida De Las Americas","city":"Houston","stateprov":"TX","country":"USA","website":null,"webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-04-18T00:00:00","dateEnd":"2019-04-21T23:59:59"},{"code":"GAROS","divisionCode":null,"name":"GRITS 2019","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Blessed Trinity Catholic High School","address":"11320 Woodstock Road","city":"Roswell","stateprov":"GA","country":"USA","website":"http://gafirst.org/events/grits-2019-1/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-10-13T00:00:00","dateEnd":"2019-10-13T23:59:59"},{"code":"GUSH","divisionCode":null,"name":"Shenzhen Regional","type":"Regional","districtCode":null,"venue":"The Sports Center of Shenzhen University","address":"No. 2032 Liuxian Road Nanshan District","city":"Shenzhen City","stateprov":"44","country":"China","website":"http://share.hisports.tv/HiSportVideo.aspx?c=6208","webcasts":["https://www.twitch.tv/firstinspires_china"],"timezone":"China Standard Time","dateStart":"2019-03-07T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"HIHO","divisionCode":null,"name":"Hawaii Regional","type":"Regional","districtCode":null,"venue":"University of Hawaii at Manoa","address":"Stan Sheriff Center","city":"Honolulu","stateprov":"HI","country":"USA","website":"http://www.friendsofhawaiirobotics.org","webcasts":[],"timezone":"Hawaiian Standard Time","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"HOPPER","divisionCode":"HOTU","name":"FIRST Championship - Houston - Hopper Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"George R. Brown Convention Center","address":"1001 Avenida De Las Americas","city":"Houston","stateprov":"TX","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_hopper"],"timezone":"Central Standard Time","dateStart":"2019-04-18T00:00:00","dateEnd":"2019-04-21T23:59:59"},{"code":"HOTU","divisionCode":"CMPTX","name":"FIRST Championship - Houston - HOTU Division","type":"ChampionshipDivision","districtCode":null,"venue":"George R. Brown Convention Center","address":"1001 Avenida De Las Americas","city":"Houston","stateprov":"TX","country":"USA","website":null,"webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-04-18T00:00:00","dateEnd":"2019-04-21T23:59:59"},{"code":"IACF","divisionCode":null,"name":"Iowa Regional","type":"Regional","districtCode":null,"venue":"McLeod Center/UNI Dome","address":"2501 Hudson Road","city":"Cedar Falls","stateprov":"IA","country":"USA","website":"http://iafirst.org/","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"IDBO","divisionCode":null,"name":"Idaho Regional","type":"Regional","districtCode":null,"venue":"Boise State University at Taco Bell Arena","address":"1401 Bronco Lane","city":"Boise","stateprov":"ID","country":"USA","website":null,"webcasts":[],"timezone":"Mountain Standard Time","dateStart":"2019-03-28T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"ILCH","divisionCode":null,"name":"Midwest Regional","type":"Regional","districtCode":null,"venue":"UIC Pavilion ","address":"University of Illinois, Chicago 525 S. Racine Ave","city":"Chicago","stateprov":"IL","country":"USA","website":"http://www.firstillinoisrobotics.org/frc/events/midwest-regional.html","webcasts":["https://www.twitch.tv/firstinspires5","https://www.twitch.tv/firstinspires6"],"timezone":"Central Standard Time","dateStart":"2019-04-04T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"ILPE","divisionCode":null,"name":"Central Illinois Regional","type":"Regional","districtCode":null,"venue":"Renaissance Coliseum - Bradley University","address":"1600 W. Main Street","city":"Peoria","stateprov":"IL","country":"USA","website":"http://www.firstillinoisrobotics.org/frc/events/central-illinois-regional/","webcasts":["https://www.twitch.tv/firstinspires3","https://www.twitch.tv/firstinspires4"],"timezone":"Central Standard Time","dateStart":"2019-03-14T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"ILROC","divisionCode":null,"name":"Rock River Offseason Competition","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Rock Valley College PEC Center","address":"3301 N Mulford Rd","city":"Rockford","stateprov":"IL","country":"USA","website":"https://r2oc.org/","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-07-28T00:00:00","dateEnd":"2019-07-28T23:59:59"},{"code":"INCMP","divisionCode":null,"name":"Indiana State Championship","type":"DistrictChampionship","districtCode":"IN","venue":"Kokomo Memorial Gymnasium","address":"5 E Superior Street","city":"Kokomo","stateprov":"IN","country":"USA","website":"http://www.indianafirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-12T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"INMIS","divisionCode":null,"name":"IN District St. Joseph Event","type":"DistrictEvent","districtCode":"IN","venue":"Penn High School","address":"56100 N Bittersweet Road","city":"Mishawaka","stateprov":"IN","country":"USA","website":"http://www.indianafirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-09T00:00:00","dateEnd":"2019-03-11T23:59:59"},{"code":"INPLA","divisionCode":null,"name":"IN District Plainfield Event sponsored by Toyota","type":"DistrictEvent","districtCode":"IN","venue":"Plainfield High School","address":"1 Red Pride Drive","city":"Plainfield","stateprov":"IN","country":"USA","website":"http://www.indianafirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-23T00:00:00","dateEnd":"2019-03-25T23:59:59"},{"code":"INWES","divisionCode":null,"name":"Boiler Bot Battle","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"France A. Córdova Recreational Sports Center","address":"355 N Martin Jischke Dr","city":"West Lafayette","stateprov":"IN","country":"USA","website":"http://www.purduefirst.org/boilerbotbattle","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-10-27T00:00:00","dateEnd":"2019-10-27T23:59:59"},{"code":"INWLA","divisionCode":null,"name":"IN District Tippecanoe Event","type":"DistrictEvent","districtCode":"IN","venue":"William Henry Harrison High School","address":"5701 N 50 W","city":"West Lafayette","stateprov":"IN","country":"USA","website":"http://www.indianafirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"IRI","divisionCode":null,"name":"Indiana Robotics Invitational","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Lawrence North High School","address":"7802 Hague Rd","city":"Indianapolis","stateprov":"IN","country":"USA","website":"http://indianaroboticsinvitational.org/","webcasts":["https://www.twitch.tv/firstinspires"],"timezone":"Eastern Standard Time","dateStart":"2019-07-12T00:00:00","dateEnd":"2019-07-14T23:59:59"},{"code":"ISCMP","divisionCode":null,"name":"FIRST Israel District Championship","type":"DistrictChampionship","districtCode":"ISR","venue":"Menora Mivtachim Arena","address":"Yigal Alon Street 51","city":"Tel Aviv-Yafo","stateprov":"TA","country":"Israel","website":"http://firstisrael.org.il","webcasts":[],"timezone":"Israel Standard Time","dateStart":"2019-03-27T00:00:00","dateEnd":"2019-03-29T23:59:59"},{"code":"ISDE1","divisionCode":null,"name":"ISR District Event #1","type":"DistrictEvent","districtCode":"ISR","venue":"Drive In Arena / Sholomo Group Arena","address":"Isaac Remba St 7","city":"Tel Aviv-Yafo","stateprov":"TA","country":"Israel","website":"http://firstisrael.org.il","webcasts":[],"timezone":"Israel Standard Time","dateStart":"2019-03-05T00:00:00","dateEnd":"2019-03-06T23:59:59"},{"code":"ISDE2","divisionCode":null,"name":"ISR District Event #2","type":"DistrictEvent","districtCode":"ISR","venue":"Drive In Arena / Sholomo Group Arena","address":"Isaac Remba St 7","city":"Tel Aviv-Yafo","stateprov":"TA","country":"Israel","website":"http://firstisrael.org.il","webcasts":[],"timezone":"Israel Standard Time","dateStart":"2019-03-07T00:00:00","dateEnd":"2019-03-08T23:59:59"},{"code":"ISDE3","divisionCode":null,"name":"ISR District Event #3","type":"DistrictEvent","districtCode":"ISR","venue":"Romema Arena","address":"Derech Pica 69","city":"Haifa","stateprov":"HA","country":"Israel","website":"http://firstisrael.org.il","webcasts":[],"timezone":"Israel Standard Time","dateStart":"2019-03-12T00:00:00","dateEnd":"2019-03-13T23:59:59"},{"code":"ISDE4","divisionCode":null,"name":"ISR District Event #4","type":"DistrictEvent","districtCode":"ISR","venue":"Romema Arena","address":"Derech Pica 69","city":"Haifa","stateprov":"HA","country":"Israel","website":"http://firstisrael.org.il","webcasts":[],"timezone":"Israel Standard Time","dateStart":"2019-03-14T00:00:00","dateEnd":"2019-03-15T23:59:59"},{"code":"LAKE","divisionCode":null,"name":"Bayou Regional","type":"Regional","districtCode":null,"venue":"Pontchartrain Center","address":"4545 Williams Blvd","city":"Kenner","stateprov":"LA","country":"USA","website":"http://www.frcbayouregional.org","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"MABOS","divisionCode":null,"name":"NE District Greater Boston Event","type":"DistrictEvent","districtCode":"NE","venue":"Revere High School","address":"101 School Street","city":"Revere","stateprov":"MA","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-06T00:00:00","dateEnd":"2019-04-08T23:59:59"},{"code":"MABRI","divisionCode":null,"name":"NE District SE Mass Event","type":"DistrictEvent","districtCode":"NE","venue":"Bridgewater-Raynham High School","address":"415 Center Street","city":"Bridgewater","stateprov":"MA","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-09T00:00:00","dateEnd":"2019-03-11T23:59:59"},{"code":"MAREA","divisionCode":null,"name":"NE District North Shore Event","type":"DistrictEvent","districtCode":"NE","venue":"Reading Memorial High School","address":"62 Oakland Road","city":"Reading","stateprov":"MA","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-16T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"MAWOR","divisionCode":null,"name":"NE District Worcester Polytechnic Institute Event","type":"DistrictEvent","districtCode":"NE","venue":"WPI Harrington Auditorium ","address":"100 Institute Road","city":"Worcester","stateprov":"MA","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-01T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"MDEDG","divisionCode":null,"name":"CHS District Central Maryland Event sponsored by Leidos","type":"DistrictEvent","districtCode":"CHS","venue":"South River High School","address":"201 Central Avenue East","city":"Edgewater","stateprov":"MD","country":"USA","website":"http://www.firstchesapeake.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-23T00:00:00","dateEnd":"2019-03-25T23:59:59"},{"code":"MDOWI","divisionCode":null,"name":"Battle O’ Baltimore","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"McDonogh School","address":"8600 McDonogh Road","city":"Owings","stateprov":"MD","country":"USA","website":"http://www.battleobaltimore.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-09-22T00:00:00","dateEnd":"2019-09-22T23:59:59"},{"code":"MDOXO","divisionCode":null,"name":"CHS District Southern Maryland Event","type":"DistrictEvent","districtCode":"CHS","venue":"Oxon Hill High School","address":"6701 Leyte Drive","city":"Oxon Hill","stateprov":"MD","country":"USA","website":"http://www.firstchesapeake.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-16T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"MELEW","divisionCode":null,"name":"NE District Pine Tree Event","type":"DistrictEvent","districtCode":"NE","venue":"Androscoggin Bank Colisee","address":"190 Birch Street","city":"Lewiston","stateprov":"ME","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-22T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"MESOU","divisionCode":null,"name":"Summer Heat","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"South Portland High School","address":"637 Highland Ave","city":"South Portland","stateprov":"ME","country":"USA","website":null,"webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-07-14T00:00:00","dateEnd":"2019-07-14T23:59:59"},{"code":"MIALP","divisionCode":null,"name":"FIM District Alpena Event","type":"DistrictEvent","districtCode":"FIM","venue":"Alpena High School","address":"3303 S 3rd Avenue","city":"Alpena","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-05T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"MIBEL","divisionCode":null,"name":"FIM District Belleville Event","type":"DistrictEvent","districtCode":"FIM","venue":"Belleville High School","address":"501 W Columbia Avenue","city":"Belleville","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-22T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"MIBIG","divisionCode":null,"name":"FSU Roboday","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Ferris State University Ewigleben Sports Complex","address":"210 Sports Drive","city":"Big Rapids","stateprov":"MI","country":"USA","website":"http://fsuroboday.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-09-29T00:00:00","dateEnd":"2019-09-29T23:59:59"},{"code":"MICEN","divisionCode":null,"name":"FIM District Center Line Event","type":"DistrictEvent","districtCode":"FIM","venue":"Center Line High School","address":"26300 Arsenal","city":"Center Line","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-08T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"MICMP","divisionCode":null,"name":"Michigan State Championship","type":"DistrictChampionshipWithLevels","districtCode":"FIM","venue":"Saginaw Valley State University","address":"Ryder Center 7400 Bay Road","city":"University Center","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-11T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"MICMP1","divisionCode":"MICMP","name":"Michigan State Championship - DTE Energy Foundation Division","type":"DistrictChampionshipDivision","districtCode":"FIM","venue":"Saginaw Valley State University","address":"Ryder Center 7400 Bay Road","city":"University Center","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-11T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"MICMP2","divisionCode":"MICMP","name":"Michigan State Championship - Consumers Energy Division","type":"DistrictChampionshipDivision","districtCode":"FIM","venue":"Saginaw Valley State University","address":"Ryder Center 7400 Bay Road","city":"University Center","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-11T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"MICMP3","divisionCode":"MICMP","name":"Michigan State Championship - Ford Division","type":"DistrictChampionshipDivision","districtCode":"FIM","venue":"Saginaw Valley State University","address":"Ryder Center 7400 Bay Road","city":"University Center","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-11T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"MICMP4","divisionCode":"MICMP","name":"Michigan State Championship - Dow Division","type":"DistrictChampionshipDivision","districtCode":"FIM","venue":"Saginaw Valley State University","address":"Ryder Center 7400 Bay Road","city":"University Center","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-11T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"MIESC","divisionCode":null,"name":"FIM District Escanaba Event","type":"DistrictEvent","districtCode":"FIM","venue":"Escanaba High School","address":"500 S. Lincoln Road","city":"Escanaba","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-15T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"MIFOR","divisionCode":null,"name":"FIM District Forest Hills Event","type":"DistrictEvent","districtCode":"FIM","venue":"Forest Hills High School","address":"5901 Hall Street SE","city":"Grand Rapids","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-05T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"MIGAY","divisionCode":null,"name":"FIM District Gaylord Event","type":"DistrictEvent","districtCode":"FIM","venue":"Gaylord High School","address":"90 Livingston Blvd","city":"Gaylord","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-15T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"MIGIB","divisionCode":null,"name":"FIM District Gibraltar Event","type":"DistrictEvent","districtCode":"FIM","venue":"Carlson High School","address":"30550 W Jefferson Avenue","city":"Gibraltar","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-01T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"MIGUL","divisionCode":null,"name":"FIM District Gull Lake Event","type":"DistrictEvent","districtCode":"FIM","venue":"Gull Lake High School","address":"7753 N. 34th Street","city":"Richland","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-15T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"MIKE2","divisionCode":null,"name":"FIM District Kettering University Event #2","type":"DistrictEvent","districtCode":"FIM","venue":"Kettering University","address":"Recreation Center 1700 University Avenue","city":"Flint","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-08T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"MIKEN","divisionCode":null,"name":"FIM District East Kentwood Event","type":"DistrictEvent","districtCode":"FIM","venue":"East Kentwood High School","address":"6230 Kalamazoo Avenue SE","city":"Kentwood","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"MIKET","divisionCode":null,"name":"FIM District Kettering University Event #1","type":"DistrictEvent","districtCode":"FIM","venue":"Kettering University","address":"Recreation Center 1700 University Avenue","city":"Flint","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-01T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"MILAK","divisionCode":null,"name":"FIM District Lakeview Event","type":"DistrictEvent","districtCode":"FIM","venue":"Lakeview High School","address":"15060 Helmer Rd S","city":"Battle Creek","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-05T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"MILAN","divisionCode":null,"name":"FIM District Lansing Event","type":"DistrictEvent","districtCode":"FIM","venue":"Mason High School","address":"1001 S. Barns Street","city":"Mason","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-22T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"MILIN","divisionCode":null,"name":"FIM District Lincoln Event","type":"DistrictEvent","districtCode":"FIM","venue":"Lincoln High School","address":"7425 Willis Road","city":"Ypsilanti","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-15T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"MILIV","divisionCode":null,"name":"FIM District Livonia Event","type":"DistrictEvent","districtCode":"FIM","venue":"Churchill High School","address":"8900 Newburgh Road","city":"Livonia","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"MILSU","divisionCode":null,"name":"FIM District Lake Superior State University Event","type":"DistrictEvent","districtCode":"FIM","venue":"Lake Superior State University","address":"650 W. Easterday Avenue","city":"Sault Ste. Marie","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-05T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"MIMAR","divisionCode":null,"name":"FIM District Marysville Event","type":"DistrictEvent","districtCode":"FIM","venue":"Marysville High School","address":"555 E. Huron Blvd.","city":"Marysville","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-05T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"MIMID","divisionCode":null,"name":"FIM District Midland Event","type":"DistrictEvent","districtCode":"FIM","venue":"H.H. Dow High School","address":"3901 N. Saginaw Road","city":"Midland","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-22T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"MIMID2","divisionCode":null,"name":"Great Lakes Bay Bot Bash","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Herbert Henry Dow High School","address":"3901 N Saginaw Rd","city":"Midland","stateprov":"MI","country":"USA","website":"https://www.first-glbr.org/great-lakes-bay-bot-bash.html","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-10-26T00:00:00","dateEnd":"2019-10-27T23:59:59"},{"code":"MIMIL","divisionCode":null,"name":"FIM District Milford Event","type":"DistrictEvent","districtCode":"FIM","venue":"Milford High School","address":"2380 S Milford Road","city":"Milford","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-15T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"MISHE","divisionCode":null,"name":"FIM District Shepherd Event","type":"DistrictEvent","districtCode":"FIM","venue":"Shepherd High School","address":"100 E Hall Street","city":"Shepherd","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"MISJO","divisionCode":null,"name":"FIM District St. Joseph Event","type":"DistrictEvent","districtCode":"FIM","venue":"St. Joseph High School","address":"2521 Stadium Drive","city":"St. Joseph","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-08T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"MISOU","divisionCode":null,"name":"FIM District Southfield Event","type":"DistrictEvent","districtCode":"FIM","venue":"Southfield High School","address":"24675 Lahser Road","city":"Southfield","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-01T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"MITRY","divisionCode":null,"name":"FIM District Troy Event","type":"DistrictEvent","districtCode":"FIM","venue":"Troy Athens High School","address":"4333 John R Road","city":"Troy","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"MITVC","divisionCode":null,"name":"FIM District Traverse City Event","type":"DistrictEvent","districtCode":"FIM","venue":"Traverse City Central High School","address":"1150 Miliken Drive","city":"Traverse City","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-01T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"MIWAT","divisionCode":null,"name":"FIM District Waterford Event","type":"DistrictEvent","districtCode":"FIM","venue":"Waterford Mott High School","address":"1151 Scott Lake Road","city":"Waterford","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-08T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"MIWMI","divisionCode":null,"name":"FIM District West Michigan Event","type":"DistrictEvent","districtCode":"FIM","venue":"Grand Valley State University","address":"Field House 10915 S Campus Drive","city":"Allendale","stateprov":"MI","country":"USA","website":"http://www.firstinmichigan.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-22T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"MNBEM","divisionCode":null,"name":"NMRC Championship","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Bemidji High School","address":"2900 Division St. W","city":"Bemidji","stateprov":"MN","country":"USA","website":null,"webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-10-27T00:00:00","dateEnd":"2019-10-27T23:59:59"},{"code":"MNCMP","divisionCode":null,"name":"MSHSL FIRST State Robotics Championship","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"3M Arena at Mariucci","address":"4 Oak Street NE","city":"Minneapolis","stateprov":"MN","country":"USA","website":"http://mnfirst.org/off-season-events/mshsl-championship/","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-05-19T00:00:00","dateEnd":"2019-05-19T23:59:59"},{"code":"MNDU","divisionCode":null,"name":"Lake Superior Regional","type":"Regional","districtCode":null,"venue":"DECC Arena/South Pioneer Hall","address":"Duluth Entertainment Convention Center 350 Harbor Drive","city":"Duluth","stateprov":"MN","country":"USA","website":"http://www.mnfirst.org","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-03-07T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"MNDU2","divisionCode":null,"name":"Northern Lights Regional","type":"Regional","districtCode":null,"venue":"DECC Arena/Edmund Fitzgerald Exhibit Hall","address":"Duluth Entertainment Convention Center 350 Harbor Drive","city":"Duluth","stateprov":"MN","country":"USA","website":"http://www.mnfirst.org","webcasts":["https://www.twitch.tv/firstinspires7","https://www.twitch.tv/firstinspires8"],"timezone":"Central Standard Time","dateStart":"2019-03-07T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"MNMI","divisionCode":null,"name":"Medtronic Foundation Regional","type":"Regional","districtCode":null,"venue":"Williams Arena/The Sports Pavilion Univ of MN","address":"1925 University Avenue SE","city":"Minneapolis","stateprov":"MN","country":"USA","website":"http://www.mnfirst.org","webcasts":["https://www.twitch.tv/firstinspires3","https://www.twitch.tv/firstinspires4"],"timezone":"Central Standard Time","dateStart":"2019-03-28T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"MNMI2","divisionCode":null,"name":"Minnesota North Star Regional","type":"Regional","districtCode":null,"venue":"3M Arena at Mariucci - University of Minnesota","address":"1901 4th Street SE","city":"Minneapolis","stateprov":"MN","country":"USA","website":"http://www.mnfirst.org","webcasts":["https://www.twitch.tv/firstinspires5","https://www.twitch.tv/firstinspires6"],"timezone":"Central Standard Time","dateStart":"2019-03-28T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"MNROS","divisionCode":null,"name":"Minnesota Robotics Invitational","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Roseville Area High School","address":"1240 West County Road B2","city":"Roseville","stateprov":"MN","country":"USA","website":"http://firebears.org/?page_id=375","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-10-13T00:00:00","dateEnd":"2019-10-13T23:59:59"},{"code":"MNWOO","divisionCode":null,"name":"EMCC","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"East Ridge High School","address":"4200 Pioneer Drive","city":"Woodbury","stateprov":"MN","country":"USA","website":"http://em-cc.org","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-09-22T00:00:00","dateEnd":"2019-09-22T23:59:59"},{"code":"MOKC","divisionCode":null,"name":"Greater Kansas City Regional","type":"Regional","districtCode":null,"venue":"Metropolitan Community College - Business and Technology Campus","address":"1775 Universal Avenue","city":"Kansas City","stateprov":"MO","country":"USA","website":"http://www.kcfirst.org","webcasts":["https://www.twitch.tv/firstinspires5","https://www.twitch.tv/firstinspires6"],"timezone":"Central Standard Time","dateStart":"2019-03-14T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"MOKC2","divisionCode":null,"name":"Heartland Regional","type":"Regional","districtCode":null,"venue":"Metropolitan Community College - Business and Technology Campus","address":"1775 Universal Avenue","city":"Kansas City","stateprov":"MO","country":"USA","website":"http://www.kcfirst.org","webcasts":["https://www.twitch.tv/firstinspires3","https://www.twitch.tv/firstinspires4"],"timezone":"Central Standard Time","dateStart":"2019-03-08T00:00:00","dateEnd":"2019-03-11T23:59:59"},{"code":"MOLEE","divisionCode":null,"name":"Cow Town ThrowDown","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Lee\'s Summit High School","address":"400 SE Blue Parkway","city":"Lee\'s Summit","stateprov":"MO","country":"USA","website":"http://cttd-robotics.com/","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-10-26T00:00:00","dateEnd":"2019-10-27T23:59:59"},{"code":"MOSL","divisionCode":null,"name":"St. Louis Regional","type":"Regional","districtCode":null,"venue":"Chaifetz Arena","address":"1 S. Compton Ave","city":"St. Louis","stateprov":"MO","country":"USA","website":"http://www.stlfirst.org/","webcasts":["https://www.twitch.tv/firstinspires9","https://www.twitch.tv/firstinspires10"],"timezone":"Central Standard Time","dateStart":"2019-03-07T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"MOSTC","divisionCode":null,"name":"Gateway Robotics Challenge","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Lindenwood University - Hyland Arena","address":"209 S Kingshighway St","city":"St. Charles","stateprov":"MO","country":"USA","website":"http://www.gatewayroboticschallenge.com/index.html","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-09-29T00:00:00","dateEnd":"2019-09-29T23:59:59"},{"code":"MRCMP","divisionCode":null,"name":"FIRST Mid-Atlantic District Championship","type":"DistrictChampionship","districtCode":"MAR","venue":"Lehigh University - Stabler Arena","address":"124 Goodman Drive","city":"Bethlehem","stateprov":"PA","country":"USA","website":"http://www.midatlanticrobotics.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-04T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"MXMO","divisionCode":null,"name":"Monterrey Regional","type":"Regional","districtCode":null,"venue":"ITESM Campus Monterrey - Gimnasio Deportivo","address":"Av. Eugenio Garza Sada 2501 Sur, Tecnologico","city":"Monterrey","stateprov":"MEX","country":"Mexico","website":"","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-02-28T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"MXTO","divisionCode":null,"name":"Laguna Regional","type":"Regional","districtCode":null,"venue":"ITESM Campus Laguna - Santiago Garza de la Mora","address":"Paseo del Tecnologico #751","city":"Torreon","stateprov":"COA","country":"Mexico","website":"http://www.firstlagunaregional.com.mx/","webcasts":[],"timezone":"Central Standard Time (Mexico)","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"NCASH","divisionCode":null,"name":"NC District UNC Asheville Event","type":"DistrictEvent","districtCode":"NC","venue":"UNC Asheville - Kimmel Arena","address":"227 Campus Drive","city":"Asheville","stateprov":"NC","country":"USA","website":"http://www.firstnorthcarolina.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-23T00:00:00","dateEnd":"2019-03-25T23:59:59"},{"code":"NCCHA","divisionCode":null,"name":"Thundering Herd of Robots (THOR)","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Olympic High School","address":"4301 Sandy Porter Road","city":"Charlotte","stateprov":"NC","country":"USA","website":"http://www.firstnorthcarolina.org/schedule-and-teams","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-09-29T00:00:00","dateEnd":"2019-09-29T23:59:59"},{"code":"NCCMP","divisionCode":null,"name":"FIRST North Carolina State Championship","type":"DistrictChampionship","districtCode":"NC","venue":"Campbell University - Gore Arena","address":"56 Main Street","city":"Lillington","stateprov":"NC","country":"USA","website":"http://www.firstnorthcarolina.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-06T00:00:00","dateEnd":"2019-04-08T23:59:59"},{"code":"NCGRE","divisionCode":null,"name":"NC District Pitt County Event","type":"DistrictEvent","districtCode":"NC","venue":"Minges Coliseum at ECU","address":"200 Ficklen Drive","city":"Greenville","stateprov":"NC","country":"USA","website":"http://www.firstnorthcarolina.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-09T00:00:00","dateEnd":"2019-03-11T23:59:59"},{"code":"NCPEM","divisionCode":null,"name":"NC District UNC Pembroke Event","type":"DistrictEvent","districtCode":"NC","venue":"UNC Pembroke - Jones Health and Physical Education Center","address":"1 University Drive","city":"Pembroke","stateprov":"NC","country":"USA","website":"http://www.firstnorthcarolina.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-16T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"NCWIN","divisionCode":null,"name":"NC District Forsyth County Event","type":"DistrictEvent","districtCode":"NC","venue":"Winston-Salem Fairgrounds - Annex","address":"421 W 27th Street","city":"Winston-Salem","stateprov":"NC","country":"USA","website":"http://www.firstnorthcarolina.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"NDGF","divisionCode":null,"name":"Great Northern Regional","type":"Regional","districtCode":null,"venue":"Alerus Center","address":"1200 S 42nd Street","city":"Grand Forks","stateprov":"ND","country":"USA","website":"http://www.mnfirst.org","webcasts":["https://www.twitch.tv/firstinspires7","https://www.twitch.tv/firstinspires8"],"timezone":"Central Standard Time","dateStart":"2019-02-28T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"NECMP","divisionCode":null,"name":"New England District Championship","type":"DistrictChampionship","districtCode":"NE","venue":"Boston University - Agganis Arena","address":"925 Commonwealth Avenue","city":"Boston","stateprov":"MA","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-11T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"NEWTON","divisionCode":"CANE","name":"FIRST Championship - Houston - Newton Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"George R. Brown Convention Center","address":"1001 Avenida De Las Americas","city":"Houston","stateprov":"TX","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_newton"],"timezone":"Central Standard Time","dateStart":"2019-04-18T00:00:00","dateEnd":"2019-04-21T23:59:59"},{"code":"NHALT","divisionCode":null,"name":"Battle Of the Bay 5","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Prospect Mountain High School","address":"242 Suncook Valley Rd","city":"Alton","stateprov":"NH","country":"USA","website":"http://www.frc319.com/battleofthebay","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-11-10T00:00:00","dateEnd":"2019-11-10T23:59:59"},{"code":"NHDUR","divisionCode":null,"name":"NE District UNH Event","type":"DistrictEvent","districtCode":"NE","venue":"UNH Whittemore Center","address":"128 Main Street","city":"Durham","stateprov":"NH","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"NHGRS","divisionCode":null,"name":"NE District Granite State Event","type":"DistrictEvent","districtCode":"NE","venue":"Windham High School","address":"64 London Bridge Road","city":"Windham","stateprov":"NH","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-02T00:00:00","dateEnd":"2019-03-04T23:59:59"},{"code":"NHHOL","divisionCode":null,"name":"Governor\'s Cup","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Plymouth State University","address":"32 N River St","city":"Holderness","stateprov":"NH","country":"USA","website":"https://firstnh.org/governors-cup","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-10-13T00:00:00","dateEnd":"2019-10-13T23:59:59"},{"code":"NHMAN","divisionCode":null,"name":"RiverRage 22","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Manchester Memorial High School","address":"1 Crusader Way","city":"Manchester","stateprov":"NH","country":"USA","website":"http://riverrage.powerknights.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-10-27T00:00:00","dateEnd":"2019-10-27T23:59:59"},{"code":"NJBRI","divisionCode":null,"name":"MAR District Bridgewater-Raritan Event","type":"DistrictEvent","districtCode":"MAR","venue":"Bridgewater-Raritan High School","address":"600 Garretson Road","city":"Bridgewater","stateprov":"NJ","country":"USA","website":"http://www.midatlanticrobotics.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-16T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"NJFLA","divisionCode":null,"name":"MAR District Mount Olive Event","type":"DistrictEvent","districtCode":"MAR","venue":"Mount Olive High School","address":"18 Corey Road","city":"Flanders","stateprov":"NJ","country":"USA","website":"http://www.midatlanticrobotics.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-09T00:00:00","dateEnd":"2019-03-11T23:59:59"},{"code":"NJNOR","divisionCode":null,"name":"Brunswick Eruption 2019","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"North Brunswick Township High School","address":"98 Raider Rd.","city":"North Brunswick","stateprov":"NJ","country":"USA","website":"http://be.raiderrobotix.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-11-10T00:00:00","dateEnd":"2019-11-10T23:59:59"},{"code":"NJSKI","divisionCode":null,"name":"MAR District Montgomery Event","type":"DistrictEvent","districtCode":"MAR","venue":"Montgomery Township High School","address":"1016 Route 601","city":"Skillman","stateprov":"NJ","country":"USA","website":"http://www.midatlanticrobotics.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-23T00:00:00","dateEnd":"2019-03-25T23:59:59"},{"code":"NJTAB","divisionCode":null,"name":"MAR District Seneca Event","type":"DistrictEvent","districtCode":"MAR","venue":"Seneca High School","address":"110 Carranza Road","city":"Tabernacle","stateprov":"NJ","country":"USA","website":"http://www.midatlanticrobotics.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-23T00:00:00","dateEnd":"2019-03-25T23:59:59"},{"code":"NVLV","divisionCode":null,"name":"Las Vegas Regional","type":"Regional","districtCode":null,"venue":"Thomas & Mack Center","address":"4505 S. Maryland Parkway","city":"Las Vegas","stateprov":"NV","country":"USA","website":"http://www.firstnevada.org","webcasts":["https://www.twitch.tv/firstinspires9","https://www.twitch.tv/firstinspires10"],"timezone":"Pacific Standard Time","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"NYDIX","divisionCode":null,"name":"Half Hollow Hills Invitational","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Half Hollow Hills High School West","address":"375 Wolf Hill Road","city":"Dix Hills","stateprov":"NY","country":"USA","website":null,"webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-10-06T00:00:00","dateEnd":"2019-10-06T23:59:59"},{"code":"NYLI","divisionCode":null,"name":"SBPLI Long Island Regional #1","type":"Regional","districtCode":null,"venue":"Hofstra University","address":"Hofstra Arena","city":"Hempstead","stateprov":"NY","country":"USA","website":"http://www.sbpli-lifirst.org","webcasts":["https://www.twitch.tv/firstinspires1","https://www.twitch.tv/firstinspires2"],"timezone":"Eastern Standard Time","dateStart":"2019-04-09T00:00:00","dateEnd":"2019-04-11T23:59:59"},{"code":"NYLI2","divisionCode":null,"name":"SBPLI Long Island Regional #2","type":"Regional","districtCode":null,"venue":"Hofstra University","address":"Hofstra Arena","city":"Hempstead","stateprov":"NY","country":"USA","website":"http://www.sbpli-lifirst.org","webcasts":["https://www.twitch.tv/firstinspires1","https://www.twitch.tv/firstinspires2"],"timezone":"Eastern Standard Time","dateStart":"2019-04-12T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"NYNY","divisionCode":null,"name":"New York City Regional","type":"Regional","districtCode":null,"venue":"The Armory Track & Field Center","address":"216 Fort Washington Avenue","city":"New York","stateprov":"NY","country":"USA","website":"http://www.nycfirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-05T00:00:00","dateEnd":"2019-04-08T23:59:59"},{"code":"NYRO","divisionCode":null,"name":"Finger Lakes Regional ","type":"Regional","districtCode":null,"venue":"Gordon Field House","address":"Rochester Institute of Technology 149 Lomb Memorial Drive","city":"Rochester","stateprov":"NY","country":"USA","website":"http://upstatenyfirst.org/","webcasts":["https://www.twitch.tv/firstinspires1","https://www.twitch.tv/firstinspires2"],"timezone":"Eastern Standard Time","dateStart":"2019-03-14T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"NYSU","divisionCode":null,"name":"Hudson Valley Regional","type":"Regional","districtCode":null,"venue":"Rockland Community College - Athletic Center","address":"145 College Road","city":"Suffern","stateprov":"NY","country":"USA","website":"http://www.nycfirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-22T00:00:00","dateEnd":"2019-03-25T23:59:59"},{"code":"NYTR","divisionCode":null,"name":"New York Tech Valley Regional","type":"Regional","districtCode":null,"venue":"Rensselaer Polytechnic Institute","address":"ECAV Arena 80 Peoples Drive","city":"Troy","stateprov":"NY","country":"USA","website":"http://www.techvalleyfirst.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-14T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"NYUT","divisionCode":null,"name":"Central New York Regional","type":"Regional","districtCode":null,"venue":"Wildcat Field House / SUNY Poly Institute","address":"100 Seymour Road","city":"Utica","stateprov":"NY","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires1","https://www.twitch.tv/firstinspires2"],"timezone":"Eastern Standard Time","dateStart":"2019-03-01T00:00:00","dateEnd":"2019-03-04T23:59:59"},{"code":"OHAUS","divisionCode":null,"name":"Mahoning Valley Robotics Challenge","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Austintown Middle School","address":"800 South Raccoon Rd","city":"Austintown","stateprov":"OH","country":"USA","website":"http://www.neofra.com/2019-mvrc","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-06-30T00:00:00","dateEnd":"2019-06-30T23:59:59"},{"code":"OHCL","divisionCode":null,"name":"Buckeye Regional","type":"Regional","districtCode":null,"venue":"Cleveland State University - Wolstein Center","address":"2000 Prospect Street","city":"Cleveland","stateprov":"OH","country":"USA","website":"http://www.firstbuckeye.org/","webcasts":["https://www.twitch.tv/firstinspires1","https://www.twitch.tv/firstinspires2"],"timezone":"Eastern Standard Time","dateStart":"2019-03-28T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"OHCOL","divisionCode":null,"name":"2019 CORI Invitational","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Worthington Kilbourne High School","address":"1499 Hard Road","city":"Columbus","stateprov":"OH","country":"USA","website":"https://www.pastfoundation.org/events/2019-cori-invitational","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-09-30T00:00:00","dateEnd":"2019-09-30T23:59:59"},{"code":"OHMV","divisionCode":null,"name":"Miami Valley Regional","type":"Regional","districtCode":null,"venue":"Wright State University","address":"Nutter Center 3640 Colonel Glenn Hwy","city":"Dayton","stateprov":"OH","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires3","https://www.twitch.tv/firstinspires4"],"timezone":"Eastern Standard Time","dateStart":"2019-02-28T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"OHWE","divisionCode":null,"name":"WOW Alliance District Championship","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Rike Center at Otterbein University","address":"170 Center St","city":"Westerville","stateprov":"OH","country":"USA","website":"https://www.pastfoundation.org/events/wow-alliance-district-championship","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-05-19T00:00:00","dateEnd":"2019-05-19T23:59:59"},{"code":"OKOK","divisionCode":null,"name":"Oklahoma Regional ","type":"Regional","districtCode":null,"venue":"Cox Arena - SMG Convention Center","address":"One Myriad Gardens","city":"Oklahoma City","stateprov":"OK","country":"USA","website":"http://www.first-oklahoma.com/","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-03-28T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"ONBAR","divisionCode":null,"name":"ONT District Georgian College Event","type":"DistrictEvent","districtCode":"ONT","venue":"Georgian College - Athletic and Fitness / Student Life Centre","address":"1 Georgian Drive","city":"Barrie","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org/events/category/frc/list/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-02T00:00:00","dateEnd":"2019-03-04T23:59:59"},{"code":"ONCMP","divisionCode":null,"name":"FIRST Ontario Provincial Championship","type":"DistrictChampionshipWithLevels","districtCode":"ONT","venue":"Hershey Centre","address":"5500 Rose Cherry Place","city":"Mississauga","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-11T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"ONCMP1","divisionCode":"ONCMP","name":"FIRST Ontario Provincial Championship - Science Division","type":"DistrictChampionshipDivision","districtCode":"ONT","venue":"Hershey Centre","address":"5500 Rose Cherry Place","city":"Mississauga","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-11T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"ONCMP2","divisionCode":"ONCMP","name":"FIRST Ontario Provincial Championship - Technology Division","type":"DistrictChampionshipDivision","districtCode":"ONT","venue":"Hershey Centre","address":"5500 Rose Cherry Place","city":"Mississauga","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-11T00:00:00","dateEnd":"2019-04-14T23:59:59"},{"code":"ONHAM","divisionCode":null,"name":"ONT District McMaster University Event","type":"DistrictEvent","districtCode":"ONT","venue":"McMaster University","address":"1280 Main Street West","city":"Hamilton","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org/events/category/frc/list/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-06T00:00:00","dateEnd":"2019-04-08T23:59:59"},{"code":"ONLON","divisionCode":null,"name":"ONT District Western University, Western Engineering Event","type":"DistrictEvent","districtCode":"ONT","venue":"Western University","address":"Thompson Recreation and Athletic Centre (TRAC) Western Road & Sarnia Road","city":"London","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org/events/category/frc/list/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-04-06T00:00:00","dateEnd":"2019-04-08T23:59:59"},{"code":"ONNOB","divisionCode":null,"name":"ONT District North Bay Event","type":"DistrictEvent","districtCode":"ONT","venue":"Nipissing University","address":"Robert J. Surtees Athletic Centre 100 College Drive","city":"North Bay","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org/events/category/frc/list/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"ONNYO","divisionCode":null,"name":"ONT District York University Event","type":"DistrictEvent","districtCode":"ONT","venue":"York University","address":"Tait McKenzie Centre 1 Thompson Rd","city":"North York","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org/events/category/frc/list/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-23T00:00:00","dateEnd":"2019-03-25T23:59:59"},{"code":"ONOSH","divisionCode":null,"name":"ONT District Durham College Event","type":"DistrictEvent","districtCode":"ONT","venue":"Durham College","address":"Campus Wellness & Recreation Center 2000 Simcoe Street North","city":"Oshawa","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org/events/category/frc/list/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-02T00:00:00","dateEnd":"2019-03-04T23:59:59"},{"code":"ONTO1","divisionCode":null,"name":"ONT District Ryerson University Event","type":"DistrictEvent","districtCode":"ONT","venue":"Ryerson University","address":"Mattamy Athletic Centre 50 Carlton Street","city":"Toronto","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org/events/category/frc/list/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-15T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"ONTOR","divisionCode":null,"name":"Robots@CNE","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Enercare Centre","address":"100 Princes\' Blvd","city":"Toronto","stateprov":"ON","country":"Canada","website":null,"webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-08-17T00:00:00","dateEnd":"2019-08-19T23:59:59"},{"code":"ONWAT","divisionCode":null,"name":"ONT District University of Waterloo Event","type":"DistrictEvent","districtCode":"ONT","venue":"University of Waterloo","address":"Physical Activities Complex 200 University Avenue West","city":"Waterloo","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org/events/category/frc/list/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-22T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"ONWIN","divisionCode":null,"name":"ONT District Windsor Essex Great Lakes Event","type":"DistrictEvent","districtCode":"ONT","venue":"University of Windsor","address":"St. Denis Centre 2555 College Avenue","city":"Windsor","stateprov":"ON","country":"Canada","website":"http://www.firstroboticscanada.org/events/category/frc/list/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"ORLAK","divisionCode":null,"name":"PNW District Lake Oswego Event","type":"DistrictEvent","districtCode":"PNW","venue":"Lake Oswego High School","address":"2501 Country Club Rd","city":"Lake Oswego","stateprov":"OR","country":"USA","website":"http://www.firstwa.org","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"ORORE","divisionCode":null,"name":"PNW District Clackamas Academy Event","type":"DistrictEvent","districtCode":"PNW","venue":"Clackamas Academy","address":"1306 12th Street","city":"Oregon City","stateprov":"OR","country":"USA","website":"http://www.firstwa.org/","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-03-01T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"ORWIL","divisionCode":null,"name":"PNW District Wilsonville Event","type":"DistrictEvent","districtCode":"PNW","venue":"Wilsonville High School","address":"6800 SW Wilsonville Road","city":"Wilsonville","stateprov":"OR","country":"USA","website":"http://oregonfirst.org/","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-03-08T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"PACA","divisionCode":null,"name":"Greater Pittsburgh Regional","type":"Regional","districtCode":null,"venue":"Convocation Center at","address":"California University of Pennsylvania  Riverview Drive","city":"California","stateprov":"PA","country":"USA","website":"http://www.pittsburghfirst.org","webcasts":["https://www.twitch.tv/firstinspires1","https://www.twitch.tv/firstinspires2"],"timezone":"Eastern Standard Time","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"PAHAT","divisionCode":null,"name":"MAR District Hatboro-Horsham Event","type":"DistrictEvent","districtCode":"MAR","venue":"Hatboro-Horsham High School","address":"899 Horsham Road","city":"Horsham","stateprov":"PA","country":"USA","website":"http://www.midatlanticrobotics.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"PAPHI","divisionCode":null,"name":"MAR District Springside Chestnut Hill Academy Event","type":"DistrictEvent","districtCode":"MAR","venue":"Springside Chestnut Hill Academy","address":"500 West Willow Grove Avenue","city":"Philadelphia","stateprov":"PA","country":"USA","website":"http://www.midatlanticrobotics.com/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-16T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"PAWCH","divisionCode":null,"name":"MAR District Westtown Event","type":"DistrictEvent","districtCode":"MAR","venue":"Westtown School","address":"975 Westtown Road","city":"West Chester","stateprov":"PA","country":"USA","website":"http://www.midatlanticrobotics.com","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-09T00:00:00","dateEnd":"2019-03-11T23:59:59"},{"code":"PNCMP","divisionCode":null,"name":"Pacific Northwest District Championship","type":"DistrictChampionship","districtCode":"PNW","venue":"Veterans Memorial Stadium","address":"300 N Winning Way","city":"Portland","stateprov":"OR","country":"USA","website":"http://www.firstwa.org","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-04-04T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"QCMO","divisionCode":null,"name":"Festival de Robotique - Montreal Regional","type":"Regional","districtCode":null,"venue":"Centre Claude-Robillard","address":"1000 Avenue Emile-Journault","city":"Montreal","stateprov":"QC","country":"Canada","website":"http://www.robotiquefirstquebec.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-02-28T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"RISMI","divisionCode":null,"name":"NE District Rhode Island Event","type":"DistrictEvent","districtCode":"NE","venue":"Bryant University","address":"1150 Douglas Pike","city":"Smithfield","stateprov":"RI","country":"USA","website":"http://www.nefirst.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-23T00:00:00","dateEnd":"2019-03-25T23:59:59"},{"code":"ROEBLING","divisionCode":"GARO","name":"FIRST Championship - Houston - Roebling Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"George R. Brown Convention Center","address":"1001 Avenida De Las Americas","city":"Houston","stateprov":"TX","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_roebling"],"timezone":"Central Standard Time","dateStart":"2019-04-18T00:00:00","dateEnd":"2019-04-21T23:59:59"},{"code":"SCCOL","divisionCode":null,"name":"South Carolina Robotics Invitational & Workshops VIII","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Dreher High School","address":"3319 Millwood Ave","city":"Columbia","stateprov":"SC","country":"USA","website":"http://scriw.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-10-20T00:00:00","dateEnd":"2019-10-20T23:59:59"},{"code":"SCMB","divisionCode":null,"name":"Palmetto Regional","type":"Regional","districtCode":null,"venue":"Myrtle Beach Convention Center","address":"2101 Oak Street","city":"Myrtle Beach","stateprov":"SC","country":"USA","website":"http://www.myrtlebeachfirstrobotics.com","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-02-28T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"SHMI","divisionCode":null,"name":"Shanghai Regional","type":"Regional","districtCode":null,"venue":"S.U.S. Sports Complex","address":"No. 2000, Wen Xiang Road","city":"Songjiang District, Shanghai","stateprov":"31","country":"China","website":"http://www.firstinspires-shanghai.org/","webcasts":["https://www.twitch.tv/firstinspires_china"],"timezone":"China Standard Time","dateStart":"2019-03-15T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"TESLA","divisionCode":"CATE","name":"FIRST Championship - Detroit - Tesla Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"Cobo Center","address":"1 Washington Boulevard","city":"Detroit","stateprov":"MI","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_tesla"],"timezone":"Eastern Standard Time","dateStart":"2019-04-25T00:00:00","dateEnd":"2019-04-28T23:59:59"},{"code":"TNKN","divisionCode":null,"name":"Smoky Mountains Regional","type":"Regional","districtCode":null,"venue":"Thompson-Boling Arena - University of Tennessee","address":"1600 Phillip Fulmer Way #202","city":"Knoxville","stateprov":"TN","country":"USA","website":"http://tnfirst.org/events/","webcasts":["https://www.twitch.tv/firstinspires3","https://www.twitch.tv/firstinspires4"],"timezone":"Eastern Standard Time","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"TUIS","divisionCode":null,"name":"Istanbul Regional","type":"Regional","districtCode":null,"venue":"Ulker Spor Ve Etkinlik Salonu","address":"Barbaros Mah., Ihlamur Sk.","city":"Bati Atasehir","stateprov":"34","country":"Turkey","website":"http://www.fikretyukselfoundation.org/","webcasts":[],"timezone":"Turkey Standard Time","dateStart":"2019-03-09T00:00:00","dateEnd":"2019-03-12T23:59:59"},{"code":"TURING","divisionCode":"HOTU","name":"FIRST Championship - Houston - Turing Subdivision","type":"ChampionshipSubdivision","districtCode":null,"venue":"George R. Brown Convention Center","address":"1001 Avenida De Las Americas","city":"Houston","stateprov":"TX","country":"USA","website":null,"webcasts":["https://www.twitch.tv/firstinspires_turing"],"timezone":"Central Standard Time","dateStart":"2019-04-18T00:00:00","dateEnd":"2019-04-21T23:59:59"},{"code":"TXCMP","divisionCode":null,"name":"Texas UIL State Championship","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Austin Convention Center","address":"500 East Ceaser Chavez","city":"Austin","stateprov":"TX","country":"USA","website":"http://firstintexas.org/","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-05-18T00:00:00","dateEnd":"2019-05-19T23:59:59"},{"code":"TXDA","divisionCode":null,"name":"Dallas Regional","type":"Regional","districtCode":null,"venue":"Irving Convention Center","address":"500 West Las Colinas Boulevard","city":"Irving","stateprov":"TX","country":"USA","website":"http://www.DallasFRC.org/","webcasts":["https://www.twitch.tv/firstinspires5","https://www.twitch.tv/firstinspires6"],"timezone":"Central Standard Time","dateStart":"2019-03-01T00:00:00","dateEnd":"2019-03-04T23:59:59"},{"code":"TXEL","divisionCode":null,"name":"El Paso Regional","type":"Regional","districtCode":null,"venue":"Judson F. Williams Convention Center","address":"One Civic Center Plaza","city":"El Paso","stateprov":"TX","country":"USA","website":"http://firstintexas.org/regions/alamo-region/brazos-valley-frc-regional/","webcasts":["https://www.twitch.tv/firstinspires7","https://www.twitch.tv/firstinspires8"],"timezone":"Mountain Standard Time","dateStart":"2019-03-28T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"TXHO","divisionCode":null,"name":"Lone Star Central Regional","type":"Regional","districtCode":null,"venue":"Strake Jesuit College Preparatory","address":"8900 Bellaire Blvd","city":"Houston","stateprov":"TX","country":"USA","website":"http://houston.txfirst.org","webcasts":["https://www.twitch.tv/firstinspires7","https://www.twitch.tv/firstinspires8"],"timezone":"Central Standard Time","dateStart":"2019-03-14T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"TXLU","divisionCode":null,"name":"Hub City Regional","type":"Regional","districtCode":null,"venue":"South Plains Fairgrounds","address":"1012 Avenue A","city":"Lubbock","stateprov":"TX","country":"USA","website":"http://hubcityregional.com","webcasts":["https://www.twitch.tv/firstinspires5","https://www.twitch.tv/firstinspires6"],"timezone":"Central Standard Time","dateStart":"2019-03-07T00:00:00","dateEnd":"2019-03-10T23:59:59"},{"code":"TXPA","divisionCode":null,"name":"Lone Star South Regional","type":"Regional","districtCode":null,"venue":"San Jacinto Community College","address":"8060 Spencer Highway","city":"Pasadena","stateprov":"TX","country":"USA","website":"http://houston.txfirst.org","webcasts":["https://www.twitch.tv/firstinspires3","https://www.twitch.tv/firstinspires4"],"timezone":"Central Standard Time","dateStart":"2019-04-04T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"TXRI","divisionCode":null,"name":"Texas Robotics Invitational","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Strake Jesuit College Prep","address":"8900 Bellaire Blvd","city":"Houston","stateprov":"TX","country":"USA","website":"http://www.spectrum3847.org/TRI","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-06-29T00:00:00","dateEnd":"2019-06-30T23:59:59"},{"code":"TXSA","divisionCode":null,"name":"Alamo Regional","type":"Regional","districtCode":null,"venue":"St. Mary\'s University","address":"Greehey Arena 1 Camino Santa Maria","city":"San Antonio","stateprov":"TX","country":"USA","website":"http://www.alamo-first.org","webcasts":[],"timezone":"Central Standard Time","dateStart":"2019-04-04T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"UTWV","divisionCode":null,"name":"Utah Regional","type":"Regional","districtCode":null,"venue":"Maverik Center","address":"3200 South Decker Lake Drive","city":"West Valley City","stateprov":"UT","country":"USA","website":"http://www.utfrc.utah.edu","webcasts":["https://www.twitch.tv/firstinspires9","https://www.twitch.tv/firstinspires10"],"timezone":"Mountain Standard Time","dateStart":"2019-02-28T00:00:00","dateEnd":"2019-03-03T23:59:59"},{"code":"VABLA","divisionCode":null,"name":"CHS District Southwest Virginia Event sponsored by Anton Paar","type":"DistrictEvent","districtCode":"CHS","venue":"Arthur Ashe Jr. Athletic Center - **new venue**","address":"3001 North Boulevard","city":"Richmond","stateprov":"VA","country":"USA","website":"http://www.firstchesapeake.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-23T00:00:00","dateEnd":"2019-03-25T23:59:59"},{"code":"VAGDC","divisionCode":null,"name":"CHS District Greater DC Event co-sponsored by Micron","type":"DistrictEvent","districtCode":"CHS","venue":"Hayfield Secondary School","address":"7630 Telegraph Road","city":"Alexandria","stateprov":"VA","country":"USA","website":"http://www.firstchesapeake.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-09T00:00:00","dateEnd":"2019-03-11T23:59:59"},{"code":"VAGLE","divisionCode":null,"name":"CHS District Central Virginia Event sponsored by Dominion Energy","type":"DistrictEvent","districtCode":"CHS","venue":"Deep Run High School","address":"4801 Twin Hickory Road","city":"Glen Allen","stateprov":"VA","country":"USA","website":"http://www.firstchesapeake.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-09T00:00:00","dateEnd":"2019-03-11T23:59:59"},{"code":"VAHAY","divisionCode":null,"name":"CHS District Northern Virginia Event","type":"DistrictEvent","districtCode":"CHS","venue":"Battlefield High School","address":"15000 Graduation Drive","city":"Haymarket","stateprov":"VA","country":"USA","website":"http://www.firstchesapeake.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-02T00:00:00","dateEnd":"2019-03-04T23:59:59"},{"code":"VAHAY2","divisionCode":null,"name":"IROC","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Battlefield High School","address":"15000 Graduation Drive","city":"Haymarket","stateprov":"VA","country":"USA","website":"http://irocoffseason.org/","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-10-20T00:00:00","dateEnd":"2019-10-20T23:59:59"},{"code":"VAPOR","divisionCode":null,"name":"CHS District Hampton Roads Event sponsored by Newport News Shipbuilding","type":"DistrictEvent","districtCode":"CHS","venue":"Churchland High School","address":"4301 Cedar Lane","city":"Portsmouth","stateprov":"VA","country":"USA","website":"http://www.firstchesapeake.org","webcasts":[],"timezone":"Eastern Standard Time","dateStart":"2019-03-16T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"WAAHS","divisionCode":null,"name":"PNW District Auburn Event","type":"DistrictEvent","districtCode":"PNW","venue":"Auburn High School","address":"711 E. Main St.","city":"Auburn","stateprov":"WA","country":"USA","website":"http://www.firstwa.org","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-03-16T00:00:00","dateEnd":"2019-03-18T23:59:59"},{"code":"WAAMV","divisionCode":null,"name":"PNW District Auburn Mountainview Event","type":"DistrictEvent","districtCode":"PNW","venue":"Auburn Mountainview High School","address":"28900 124th Avenue SE","city":"Auburn","stateprov":"WA","country":"USA","website":"http://www.firstwa.org/","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-03-29T00:00:00","dateEnd":"2019-03-31T23:59:59"},{"code":"WAMAP","divisionCode":null,"name":"Washington Girls\' Generation 2019","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Tahoma High School","address":"23499 SE Tahoma Way","city":"Maple Valley","stateprov":"WA","country":"USA","website":null,"webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-10-27T00:00:00","dateEnd":"2019-10-27T23:59:59"},{"code":"WAMOU","divisionCode":null,"name":"PNW District Mount Vernon Event","type":"DistrictEvent","districtCode":"PNW","venue":"Mount Vernon High School","address":"314 North 9th Street","city":"Mount Vernon","stateprov":"WA","country":"USA","website":"http://www.firstwa.org/","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-03-02T00:00:00","dateEnd":"2019-03-04T23:59:59"},{"code":"WAPP","divisionCode":null,"name":"Peak Performance","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Seattle Christian School","address":"18301 Military Rd. S","city":"SeaTac","stateprov":"WA","country":"USA","website":"http://offseason.apexfrc.com/","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-09-08T00:00:00","dateEnd":"2019-09-08T23:59:59"},{"code":"WASNO","divisionCode":null,"name":"PNW District Glacier Peak Event","type":"DistrictEvent","districtCode":"PNW","venue":"Glacier Peak High School","address":"7401 144th Place SE","city":"Snohomish","stateprov":"WA","country":"USA","website":"http://www.firstwa.org/","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-03-23T00:00:00","dateEnd":"2019-03-25T23:59:59"},{"code":"WASPO","divisionCode":null,"name":"PNW District West Valley Event","type":"DistrictEvent","districtCode":"PNW","venue":"West Valley High School","address":"8301 E. Buckeye Avenue","city":"Spokane","stateprov":"WA","country":"USA","website":"http://www.firstwa.org","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-03-22T00:00:00","dateEnd":"2019-03-24T23:59:59"},{"code":"WAYAK","divisionCode":null,"name":"PNW District SunDome Event","type":"DistrictEvent","districtCode":"PNW","venue":"SunDome, State Fair Park","address":"1301 S. Fair Avenue","city":"Yakima","stateprov":"WA","country":"USA","website":"http://www.firstwa.org/","webcasts":[],"timezone":"Pacific Standard Time","dateStart":"2019-03-15T00:00:00","dateEnd":"2019-03-17T23:59:59"},{"code":"WEEK0","divisionCode":null,"name":"Week 0","type":"OffSeasonWithAzureSync","districtCode":null,"venue":"Bedford High School","address":"47B Nashua Road","city":"Bedford","stateprov":"NH","country":"USA","website":"https://sites.google.com/bedfordnhk12.net/redstorm509/week-zero","webcasts":["https://www.twitch.tv/firstinspires","https://www.twitch.tv/firstinspires1"],"timezone":"Eastern Standard Time","dateStart":"2019-02-17T00:00:00","dateEnd":"2019-02-17T23:59:59"},{"code":"WILA","divisionCode":null,"name":"Seven Rivers Regional","type":"Regional","districtCode":null,"venue":"La Crosse Center","address":"300 Harborview Plaza","city":"La Crosse","stateprov":"WI","country":"USA","website":"http://www.wisconsinfrc.com/","webcasts":["https://www.twitch.tv/firstinspires7","https://www.twitch.tv/firstinspires8"],"timezone":"Central Standard Time","dateStart":"2019-04-04T00:00:00","dateEnd":"2019-04-07T23:59:59"},{"code":"WIMI","divisionCode":null,"name":"Wisconsin Regional","type":"Regional","districtCode":null,"venue":"UW - Milwaukee Panther Arena","address":"400 West Kilbourn Avenue","city":"Milwaukee","stateprov":"WI","country":"USA","website":"http://www.wisconsinfrc.com","webcasts":["https://www.twitch.tv/firstinspires5","https://www.twitch.tv/firstinspires6"],"timezone":"Central Standard Time","dateStart":"2019-03-21T00:00:00","dateEnd":"2019-03-24T23:59:59"}]');
           createEventMenu();
            
        }
    });
    
    req.send()
}

function filterEvents() {
    "use strict";
    var filterClasses = "";
    var previousFilters = JSON.parse(localStorage.eventFilters);
    if (!$("#offseason").bootstrapSwitch('state')) {
        $(".eventsfilter").hide();
        var filters = $("#eventFilters").selectpicker('val');
        if (filters.indexOf("clear") >= 0 || filters.length === 0) {
            $("#eventFilters").selectpicker('deselectAll');
            $(".eventsfilter").show()
        } else {
            if (filters.indexOf("past") >= 0) {
                if (previousFilters.indexOf("future") >= 0) {
                    filters.splice(filters.indexOf("future"), 1)
                }
            }
            if (filters.indexOf("future") >= 0) {
                if (previousFilters.indexOf("past") >= 0) {
                    filters.splice(filters.indexOf("past"), 1)
                }
            }
            filterClasses = ".filters" + filters[0];
            if (filters.length > 1) {
                for (var i = 1; i < filters.length; i++) {
                    filterClasses += ".filters" + filters[i]
                }
            }
            $(filterClasses).show()
        }
        localStorage.eventFilters = JSON.stringify(filters);
    }
}

function createEventMenu() {
    "use strict";
    var tmp = currentEventList;
    var options = [];
    var events = {};
    for (var i = 0; i < tmp.length; i++) {
        var _option = { text: tmp[i].name, value: tmp[i] };
        options.push(_option);
        events[tmp[i].code] = tmp[i].name
    }
    options.sort(function (a, b) {
        if (a.text < b.text) {
            return -1
        }
        if (a.text > b.text) {
            return 1
        }
        return 0
    });
    var sel = $('#eventSelector');
    sel.empty();
    $.each(options, function (index, option) {
        var optionClass = "";
        var optionPrefix = "";
        var optionPostfix = "";
        var optionFilter = "";
        var timeNow = moment();
        var eventTime = moment(option.value.dateEnd);
        if (option.value.type === "OffSeasonWithAzureSync") {
            optionClass = "bg-info";
            optionPrefix = "•• ";
            optionPostfix = " ••"
        }
        if (option.value.type.startsWith("Regional")) {
            optionFilter += " eventsfilter filtersregional"
        } else if (option.value.type.startsWith("Champion")) {
            optionFilter += " eventsfilter filterschamps"
        } else if (option.value.type.startsWith("OffSeason")) {
            optionFilter += " eventsfilter filtersoffseason"
        } else if (option.value.type.startsWith("District")) {
            optionFilter += " eventsfilter filters" + option.value.districtCode
        }
        if (timeNow.diff(eventTime) < 0) {
            optionFilter += " filtersfuture"
        } else {
            optionFilter += " filterspast"
        }
        optionFilter += " " + eventWeek(option.value);
        sel.append($('<option></option>').attr({
            'value': JSON.stringify(option.value),
            'class': optionClass + optionFilter,
            'id': 'eventSelector' + option.value.code
        }).text(optionPrefix + option.text + optionPostfix))
    });
    if (!localStorage.eventSelector) {
        sel.selectpicker('refresh')
    } else {
        if (localStorage.eventSelector) {
            document.getElementById("eventSelector" + localStorage.eventSelector).selected = !0
        }
        sel.selectpicker('refresh')
    }
    localStorage.events = JSON.stringify(events);
    var previousFilters = JSON.parse(localStorage.eventFilters);
    $("#eventFilters").selectpicker('val', previousFilters);
    //filterEvents();
    handleEventSelection();
    $("#eventUpdateContainer").html(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"))
}

function getHybridSchedule() {
    "use strict";
    if (localStorage.offseason === "true") {
        getOffseasonSchedule()
    } else {
        getRegularSeasonSchedule()
    }
}

function ranksQualsCompare() {
    "use strict";
    $("#allianceSelectionWarning").show();
    if (allianceSelectionReady) {
        $("#allianceSelectionWarning").html('<p class="alert alert-success" onclick="announceDisplay();"><strong>Your ranks appear to be current, but you must confirm that the rank order below agrees with the rank order in FMS before proceeding with Alliance Selection</strong> If you see a discrepancy, tap this alert to see if we can get a more current rankings.</p>');
        $('#allianceSelectionTabPicker').removeClass('alert-danger');
        $('#allianceSelectionTabPicker').addClass('alert-success')
    } else {
        var allianceSelectionMessage = '<p class="alert alert-danger" onclick="announceDisplay();"><strong>Do not proceed with Alliance Selection until you confirm that the rank order below agrees with the rank order in FMS. Tap this alert to see if we can get a more current schedule and rankings.</strong></p>';
        if (haveRanks && !showAllianceSelectionOverride) allianceSelectionMessage += '<p id="showAllianceSelectionWarning" class="alert alert-warning" onclick="showAllianceSelection();">If your event shortens the Qualification Match schedule and you need to move to Alliance Selection, tap here to show Alliance Selection.</p>';
        $("#allianceSelectionWarning").html(allianceSelectionMessage);
        $('#allianceSelectionTabPicker').addClass('alert-danger');
        $('#allianceSelectionTabPicker').removeClass('alert-success')
    }
}

function showAllianceSelection() {
    "use strict";
    BootstrapDialog.show({
        type: 'type-danger',
        title: '<b>Show Alliance Selection</b>',
        message: 'You are about to show the Alliance Selection, but according to FMS, your event has not completed. Do you agree to the following:<br><ul style="list-style-type:square"><li>The event has reduced the qual schedule due to time, inclement weather or other factors</li><li>I have reviewed the rankings in gatool with the scorekeeper and we are in agreement</li><li>My FTA has agreed that we can continue to Alliance Selection with a shortened schedule</li></ul>',
        buttons: [{
            icon: 'glyphicon glyphicon-check',
            label: "No, don't show Alliance Selection.",
            hotkey: 78, // "N".
            cssClass: "btn btn-success alertButton",
            action: function (dialogRef) {
                dialogRef.close();
            }
        }, {
            icon: 'glyphicon glyphicon-refresh',
            label: 'Yes, I do want to show Alliance Selection now.<br>I understand that I am responsible for the accuracy of Alliance Selection.',
            hotkey: 13, // Enter.
            cssClass: 'btn btn-danger alertButton',
            action: function (dialogRef) {
                dialogRef.close();
                $("#allianceSelectionTable").show();
                showAllianceSelectionOverride = true;
                $("#showAllianceSelectionWarning").hide();
                BootstrapDialog.show({
                    message: "Alliance Selection is now visible. Please ensure the accuracy of your rankings prior to starting Alliance Selection.",
                    buttons: [{
                        icon: 'glyphicon glyphicon-refresh',
                        label: 'OK',
                        hotkey: 13, // Enter.
                        title: 'OK',
                        action: function (dialogRef) {
                            dialogRef.close();
                        }
                    }]
                });

            }
        }]
    });
}


function getRegularSeasonSchedule() {
    "use strict";
    $("#scheduleUpdateContainer").html("Loading schedule data...");
    $('#scheduleTabPicker').addClass('alert-danger');
    var matchSchedule = "";
    var matchPicker = "";
    var qualScheduleLength = 0;
    lastMatchPlayed = 0;
    lastPlayoffMatchPlayed = 0;
    var req = new XMLHttpRequest();
    req.open('GET', apiURL + localStorage.currentYear + '/schedule/' + localStorage.currentEvent + '/qual?returnschedule=true');
    req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req.addEventListener('load', function () {
        if (req.status === 200) {
            var data = JSON.parse(req.responseText);
            if (data.Schedule.length === 0) {
                $('#scheduleContainer').html('<b>No qualification matches have been scheduled for this event.</b>');
                localStorage.qualsList = '{"Schedule":[]}';
                localStorage.playoffList = '{"Schedule":[]}'
            } else {
                $("#scheduleContainer").html('<p class = "eventName">' + localStorage.eventName + '</p><table id="scheduleTable" class="table table-bordered table-responsive table-striped"></table>');
                matchSchedule += '<thead class="thead-default"><tr><td class="col2"><b>Time</b></td><td  class="col2"><b>Description</b></td><td class="col1"><b>Match Number</b></td><td class="col1"><b>Score</b></td><td class="col1"><b>Station 1</b></td><td class="col1"><b>Station 2</b></td><td class="col1"><b>Station 3</b></td></tr></thead><tbody>';
                qualScheduleLength = data.Schedule.length;
                for (var i = 0; i < data.Schedule.length; i++) {
                    var element = data.Schedule[i];
                    var optionClass = "";
                    if ((element.scoreRedFinal !== null) && (element.scoreBlueFinal !== null)) {
                        optionClass = ' class="bg-success" '
                    }
                    matchSchedule += generateMatchTableRow(element);
                    matchPicker += '<option id="matchPicker' + parseInt(i + 1) + '"' + optionClass + ' matchNumber="' + parseInt(i + 1) + '" value="' + parseInt(i + 1) + '">' + element.description + '</option>';
                    if ((element.scoreRedFinal !== null) && (element.scoreBlueFinal !== null)) {
                        lastMatchPlayed = parseInt(i + 1)
                    }
                }
                localStorage.qualsList = JSON.stringify(data);
                $("#announceBanner, #playByPlayBanner").hide();
                $("#announceDisplay, #playByPlayDisplay").show();
                haveSchedule = !0;
                lastQualsUpdate = req.getResponseHeader("Last-Modified");
                if (lastMatchPlayed >= data.Schedule.length - 1) {
                    $("#allianceSelectionTable").show();
                    $(".thirdAllianceSelection").hide();
                    $("#backupTeamsTable").show();
                    if (inChamps() || inSubdivision()) {
                        $(".thirdAllianceSelection").show();
                        $("#backupTeamsTable").hide()
                    }
                    qualsComplete = !0
                }
                $('#scheduleTabPicker').removeClass('alert-danger');
                $('#scheduleTabPicker').addClass('alert-success');
                matchCount = parseInt(Number(JSON.parse(localStorage.qualsList).Schedule.length) * 6 / Number(JSON.parse(localStorage.teamList).length));
                $("#scheduleUpdateContainer").html(moment().format("dddd, MMMM Do YYYY, h:mm:ss a") + "... and looking for Playoff schedule...");
                req1.send()
            }

        }
    });
    var req1 = new XMLHttpRequest();
    req1.open('GET', apiURL + localStorage.currentYear + '/schedule/' + localStorage.currentEvent + '/playoff?returnschedule=true');
    req1.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req1.addEventListener('load', function () {
        if (req1.status === 200) {
            $("#playoffScheduleAlert").show();
            var data = JSON.parse(req1.responseText);
            if (data.Schedule.length === 0) {
                document.getElementById('scheduleContainer').innerHTML += '<p><b>No playoff matches have been scheduled for this event.</b></p>';
                localStorage.playoffList = "";
                $("#matchPicker").html(matchPicker);
                if (localStorage.autoAdvance === "true") {
                    if (lastMatchPlayed < (qualScheduleLength)) {
                        localStorage.currentMatch = String(lastMatchPlayed + 1)
                    } else {
                        localStorage.currentMatch = String(lastMatchPlayed)
                    }
                    document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0;
                    $("#matchPicker").selectpicker('refresh')
                } else if (localStorage.currentMatch) {
                    document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0;
                    $("#matchPicker").selectpicker('refresh')
                }
                if (haveSchedule) {
                    $("#allianceSelectionWarning").show();
                    announceDisplay()
                }
            } else {
                haveSchedule = !0;
                $(".playoffBadge").removeClass("redScore blueScore tieScore greyScore");
                $(".playoffBadge").addClass("greyScore");
                for (var i = 0; i < data.Schedule.length; i++) {
                    var element = data.Schedule[i];
                    var optionClass = "";
                    if ((element.scoreRedFinal !== null) && (element.scoreBlueFinal !== null)) {
                        optionClass = ' class="bg-success" ';
                        lastMatchPlayed = i + qualScheduleLength + 1;
                        lastPlayoffMatchPlayed = element.matchNumber;
                    }
                    matchSchedule += generateMatchTableRow(element);
                    matchPicker += '<option id="matchPicker' + parseInt(i + qualScheduleLength + 1) + '"' + optionClass + ' matchNumber="' + parseInt(i + qualScheduleLength + 1) + '" value="' + parseInt(i + qualScheduleLength + 1) + '">' + element.description + '</option>';

                }
                playoffScoreDetails(1, lastPlayoffMatchPlayed, "playoff");
                $("#matchPicker").html(matchPicker);
                document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0;
                $("#matchPicker").selectpicker('refresh');
                localStorage.inPlayoffs = "true";
                $("#playoffBracket").show();
                $("#allianceBracket").html("Playoff Bracket");
                $('#allianceSelectionTabPicker').removeClass('alert-danger');
                $('#allianceSelectionTabPicker').addClass('alert-success');
                $("#allianceSelectionTable").hide();
                $("#allianceSelectionWarning").hide();
                $("#allianceInfo").hide();
                prepareAllianceSelection();
                // if (lastMatchPlayed >= data.Schedule.length - 1) {
                //     $("#allianceSelectionTable").show();
                //     $(".thirdAllianceSelection").hide();
                //     $("#backupTeamsTable").show();
                //     if (inChamps() || inSubdivision()) {
                //         $(".thirdAllianceSelection").show();
                //         $("#backupTeamsTable").hide()
                //     }
                // }
                getAllianceList()
            }
            if (matchSchedule) {
                document.getElementById('scheduleTable').innerHTML += matchSchedule
            }
            $('#scheduleProgressBar').hide();
            localStorage.playoffList = JSON.stringify(data);
            $("#scheduleUpdateContainer").html(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
            if (localStorage.autoAdvance === "true") {
                if (lastMatchPlayed < (qualScheduleLength + data.Schedule.length)) {
                    localStorage.currentMatch = String(lastMatchPlayed + 1)
                } else {
                    localStorage.currentMatch = String(lastMatchPlayed)
                }
                document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0;
                $("#matchPicker").selectpicker('refresh')
            }
            if (matchSchedule) {
                announceDisplay()
            }
        }
    });
    var reqChamps = new XMLHttpRequest();
    reqChamps.open('GET', apiURL + localStorage.currentYear + '/schedule/' + localStorage.currentEvent + '/playoff?returnschedule=true');
    reqChamps.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    reqChamps.addEventListener('load', function () {
        if (reqChamps.status === 200) {
            var data = JSON.parse(reqChamps.responseText);
            if (data.Schedule.length === 0) {
                $('#scheduleContainer').html('<b>No matches have been scheduled for this event.</b>');
                localStorage.qualsList = '{"Schedule":[]}';
                localStorage.playoffList = '{"Schedule":[]}'
            } else {
                haveSchedule = !0;
                $(".playoffBadge").removeClass("redScore blueScore tieScore greyScore");
                $(".playoffBadge").addClass("greyScore");
                $("#scheduleContainer").html('<p class = "eventName">' + localStorage.eventName + '</p><table id="scheduleTable" class="table table-bordered table-responsive table-striped"></table>');
                matchSchedule += '<thead class="thead-default"><tr><td class="col2"><b>Time</b></td><td  class="col2"><b>Description</b></td><td class="col1"><b>Match Number</b></td><td class="col1"><b>Score</b></td><td class="col1"><b>Station 1</b></td><td class="col1"><b>Station 2</b></td><td class="col1"><b>Station 3</b></td></tr></thead><tbody>';
                qualScheduleLength = data.Schedule.length;
                for (var i = 0; i < data.Schedule.length; i++) {
                    var element = data.Schedule[i];
                    matchSchedule += generateMatchTableRow(element);
                    matchPicker += '<option id="matchPicker' + parseInt(i + 1) + '" matchNumber="' + parseInt(i + 1) + '">' + element.description + '</option>';
                    if ((element.scoreRedFinal !== null) && (element.scoreBlueFinal !== null)) {
                        lastMatchPlayed = element.matchNumber;
                        lastPlayoffMatchPlayed = element.matchNumber;
                    }

                }
                playoffScoreDetails(1, lastPlayoffMatchPlayed, "playoff");
                localStorage.qualsList = JSON.stringify(data);
                $("#announceBanner, #playByPlayBanner").hide();
                $("#announceDisplay, #playByPlayDisplay").show();
                $("#matchPicker").html(matchPicker);
                document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0;
                $("#matchPicker").selectpicker('refresh');
                localStorage.inPlayoffs = "true";
                $("#playoffBracket").show();
                $("#allianceBracket").html("Playoff Bracket");
                $('#allianceSelectionTabPicker').removeClass('alert-danger');
                $('#allianceSelectionTabPicker').addClass('alert-success'),
                    $("#allianceSelectionTable").hide();
                if (localStorage.autoAdvance === "true") {
                    if (lastMatchPlayed < (qualScheduleLength)) {
                        localStorage.currentMatch = String(lastMatchPlayed + 1)
                    } else {
                        localStorage.currentMatch = String(lastMatchPlayed)
                    }
                    document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0;
                    $("#matchPicker").selectpicker('refresh')
                } else if (localStorage.currentMatch) {
                    document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0;
                    $("#matchPicker").selectpicker('refresh')
                }
                $("#scheduleUpdateContainer").html(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
                $('#scheduleTabPicker').removeClass('alert-danger');
                $('#scheduleTabPicker').addClass('alert-success');
                if (matchSchedule) {
                    document.getElementById('scheduleTable').innerHTML += matchSchedule
                }
                $('#scheduleProgressBar').hide();
                localStorage.playoffList = JSON.stringify(data);
                $("#scheduleUpdateContainer").html(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
                displayAwardsTeams(allianceListUnsorted.slice(0));
                getAllianceList()
            }
        }
    });
    if (inChamps() || (inMiChamps() && (localStorage.currentYear >= 2017))) {
        reqChamps.send()
    } else {
        req.send()
    }
}

function processPlayoffBracket(matchData) {
    var bracketDetail = {};
    bracketDetail.description = matchData.description;
    if (matchData.description.split(" ")[0] === "Final") {
        bracketDetail.description = "Final";
    } else {
        bracketDetail.description = matchData.description;
    }
    bracketDetail.redAlliance = [];
    bracketDetail.blueAlliance = [];
    bracketDetail.winner = "grey";
    bracketDetail.matchName = "bracketMatch" + matchData.matchNumber;
    $("#" + bracketDetail.matchName + "Result").removeClass("redScore blueScore tieScore greyScore");
    if ((matchData.teams[0].teamNumber !== null) || (matchData.teams[4].teamNumber !== null)) {
        for (var i = 0; i < matchData.teams.length; i++) {
            if (matchData.teams[i].station.includes("ed")) {
                bracketDetail.redAlliance.push(matchData.teams[i].teamNumber);
            }
            if (matchData.teams[i].station.includes("ue")) {
                bracketDetail.blueAlliance.push(matchData.teams[i].teamNumber);
            }
        }
        if (matchData.scoreRedFinal > matchData.scoreBlueFinal) {
            bracketDetail.winner = "red";
        } else if (matchData.scoreRedFinal < matchData.scoreBlueFinal) {
            bracketDetail.winner = "blue";
        } else if ((matchData.scoreRedFinal === matchData.scoreBlueFinal) && (matchData.scoreRedFinal > 0)) {
            bracketDetail.winner = "tie"
        }
        if (matchData.teams[0].teamNumber !== null) {
            bracketDetail.redAllianceName = decompressLocalStorage("teamData" + bracketDetail.redAlliance[0]).allianceName;
        } else {
            bracketDetail.redAllianceName = "TBD";
        }
        if (matchData.teams[4].teamNumber !== null) {
            bracketDetail.blueAllianceName = decompressLocalStorage("teamData" + bracketDetail.blueAlliance[0]).allianceName;
        } else {
            bracketDetail.blueAllianceName = "TBD";
        }
        bracketDetail.output = bracketDetail.description + '<br><span class="bracketRedAlliance">' + bracketDetail.redAllianceName + '<br>vs<br><span class="bracketBlueAlliance">' + bracketDetail.blueAllianceName + '<br><br><span class="bracketRedAlliance">' + bracketDetail.redAlliance.join(" ") + '</span><br><span class="bracketBlueAlliance">' + bracketDetail.blueAlliance.join(" ") + '</span><br>';

    } else {
        bracketDetail.output = "TBD"
    }


    $("#" + bracketDetail.matchName).html(bracketDetail.output);
    $("#" + bracketDetail.matchName + "Result").addClass(bracketDetail.winner + "Score");
    $("#" + bracketDetail.matchName + "RedScore").removeClass("redScoreWin");
    $("#" + bracketDetail.matchName + "BlueScore").removeClass("blueScoreWin");
    if (matchData.scoreRedFinal !== null) {
        $("#" + bracketDetail.matchName + "RedScore").html(matchData.scoreRedFinal);
        if (bracketDetail.winner === "red") {
            $("#" + bracketDetail.matchName + "RedScore").addClass("redScoreWin");
        }
    } else {
        $("#" + bracketDetail.matchName + "RedScore").html("–");
    }
    if (matchData.scoreBlueFinal !== null) {
        $("#" + bracketDetail.matchName + "BlueScore").html(matchData.scoreBlueFinal);
        if (bracketDetail.winner === "blue") {
            $("#" + bracketDetail.matchName + "BlueScore").addClass("blueScoreWin");
        }
    } else {
        $("#" + bracketDetail.matchName + "BlueScore").html("–");
    }
    if (matchData.matchNumber > 21 && bracketDetail.winner !== "grey") {
        $("#" + bracketDetail.matchName + "Overtime").show();
    }
}

function getOffseasonSchedule() {
    "use strict";
    $("#scheduleUpdateContainer").html("Loading schedule data...");
    $('#scheduleTabPicker').addClass('alert-danger');
    var matchSchedule = "";
    var matchPicker = "";
    var qualScheduleLength = 0;
    var i = 0;
    var element;
    var data;
    lastMatchPlayed = 0;
    lastPlayoffMatchPlayed = 0;
    data = JSON.parse(localStorage.qualsList);
    if (data.Schedule.length === 0) {
        $('#scheduleContainer').html('<b>No qualification matches have been scheduled for this event.</b>')
        haveSchedule = false;
    } else {
        $("#scheduleContainer").html('<p class = "eventName">' + localStorage.eventName + '</p><table id="scheduleTable" class="table table-bordered table-responsive table-striped"></table>');
        matchSchedule += '<thead class="thead-default"><tr><td class="col2"><b>Time</b></td><td  class="col2"><b>Description</b></td><td class="col1"><b>Match Number</b></td><td class="col1"><b>Score</b></td><td class="col1"><b>Station 1</b></td><td class="col1"><b>Station 2</b></td><td class="col1"><b>Station 3</b></td></tr></thead><tbody>';
        qualScheduleLength = data.Schedule.length;
        haveSchedule = true;
        for (i = 0; i < data.Schedule.length; i++) {
            element = data.Schedule[i];
            matchSchedule += generateMatchTableRow(element);
            matchPicker += '<option id="matchPicker' + parseInt(i + 1) + '" matchNumber="' + parseInt(i + 1) + '">' + element.description + '</option>'
        }
        $("#announceBanner, #playByPlayBanner").hide();
        $("#announceDisplay, #playByPlayDisplay").show();
        $('#scheduleTabPicker').removeClass('alert-danger');
        $('#scheduleTabPicker').addClass('alert-success')
    }
    $("#scheduleUpdateContainer").html(moment().format("dddd, MMMM Do YYYY, h:mm:ss a") + "... and looking for Playoff schedule...");
    $("#playoffScheduleAlert").show();
    data = JSON.parse(localStorage.playoffList);
    if (data.Schedule.length === 0) {
        document.getElementById('scheduleContainer').innerHTML += '<p><b>No playoff matches have been scheduled for this event.</b></p>';
        $("#matchPicker").html(matchPicker);
        if (document.getElementById("matchPicker" + localStorage.currentMatch)) {
            document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0
        }
        $("#matchPicker").selectpicker('refresh')
    } else {
        for (i = 0; i < data.Schedule.length; i++) {
            element = data.Schedule[i];
            matchSchedule += generateMatchTableRow(element);
            matchPicker += '<option id="matchPicker' + parseInt(i + qualScheduleLength + 1) + '"  matchNumber="' + parseInt(i + qualScheduleLength + 1) + '">' + element.description + '</option>'
        }
        $("#matchPicker").html(matchPicker);
        document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0;
        $("#matchPicker").selectpicker('refresh');
        localStorage.inPlayoffs = "true";
        $("#playoffBracket").hide();
        $(".playoffCells").html("TBD");
        $(".playoffBadge").removeClass("redScore blueScore tieScore greyScore");
    }
    if (matchSchedule) {
        document.getElementById('scheduleTable').innerHTML += matchSchedule
    }
    $('#scheduleProgressBar').hide();
    $("#scheduleUpdateContainer").html(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));
    announceDisplay()
}

function handleMatchSelection(element) {
    "use strict";
    var matchNumberSelected = $(element).children(":selected").attr("matchNumber");
    localStorage.currentMatch = matchNumberSelected;
    document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0;
    $("#matchPicker").selectpicker('refresh');
    updateMatchResults()
}

function updateTeamTable() {
    "use strict";
    var teamData = eventTeamList.slice(0);
    $("#teamsTableBody").empty();
    for (var i = 0; i < teamData.length; i++) {
        var element = teamData[i];
        $('#teamsTableBody').append(updateTeamTableRow(element))
    }
    if (haveSchedule) {
        announceDisplay()
    }
}

function getTeamList(year) {
    "use strict";
    $("#teamDataTabPicker").addClass("alert-danger");
    $("#teamUpdateContainer").html("Loading team data...");
    var req = new XMLHttpRequest();
    var endpoint = "/teams?eventCode=";
    req.open('GET', apiURL + year + endpoint + localStorage.currentEvent);
    req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req.addEventListener('load', function () {
        if (req.status === 200) {
            var data = {};
            $('#teamloadprogress').show();
            $('#teamProgressBar').show();
            $("#teamsTableBody").empty()

            if (req.responseText.includes('"teams":')) {
                data = JSON.parse(req.responseText)
            } else {
                data = JSON.parse('{"teams":[],"teamCountTotal":0,"teamCountPage":0,"pageCurrent":0,"pageTotal":0}')
            }
            if (data.teams.length === 0) {
                $('#teamsTableEventName').html('Event team list unavailable.');
                $("#eventTeamCount").html(data.teamCountTotal);
                teamCountTotal = data.teamCountTotal;
                localStorage.teamList = "[]"
            } else {

                $("#eventTeamCount").html(data.teamCountTotal);
                teamCountTotal = data.teamCountTotal;
                $('#teamsTableEventName').html(localStorage.eventName)

                for (var i = 0; i < data.teams.length; i++) {
                    var element = data.teams[i];
                    $('#teamsTableBody').append(generateTeamTableRow(element));
                    eventTeamList.push(data.teams[i])
                }
                for (var j = 0; j < eventTeamList.length; j++) {
                    var team = decompressLocalStorage("teamData" + eventTeamList[j].teamNumber);
                    team.rank = "";
                    team.alliance = "";
                    team.allianceName = "";
                    team.allianceChoice = "";
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
                    compressLocalStorage("teamData" + eventTeamList[j].teamNumber, team);
                    highScores['"' + eventTeamList[j].teamNumber + '.score"'] = 0;
                    highScores['"' + eventTeamList[j].teamNumber + '.description"'] = "";
                }
                localStorage.teamList = JSON.stringify(eventTeamList);
                if ((localStorage.eventDistrict !== "") && (localStorage.eventName.search("hampionship") >= 0)) {
                    var districtEvents = [];
                    var districtPromises = [];
                    for (var i = 0; i < currentEventList.length; i++) {
                        if (currentEventList[i].districtCode === localStorage.eventDistrict) {
                            districtEvents.push(currentEventList[i].code);
                        }
                    }
                    for (i = 0; i < districtEvents.length; i++) {
                        districtPromises.push(new Promise((resolve, reject) => {
                            var req = new XMLHttpRequest();
                            req.open('GET', apiURL + localStorage.currentYear + '/awards/' + districtEvents[i] + "/");
                            req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
                            req.addEventListener('load', function () {
                                var districtTeams = [];
                                var data = JSON.parse(req.responseText);
                                if (data.Awards !== '{"Awards":[]}') {
                                    for (var i = 0; i < data.Awards.length; i++) {
                                        if ((data.Awards[i].awardId === 633) || (data.Awards[i].awardId === 417)) {
                                            //Engineering Inspiration or Rookie All Star Award
                                            if (data.Awards[i].teamNumber !== null) {
                                                districtTeams.push({
                                                    "teamNumber": data.Awards[i].teamNumber
                                                });
                                            }

                                        }
                                        //console.log(districtTeams);
                                        //console.log("handing back the values");
                                    }
                                }
                                resolve(districtTeams);

                            });
                            req.send();

                        }));
                    }
                    Promise.all(districtPromises).then(function (values) {
                        var districtTeamsAll = [];
                        var districtTeams = [];
                        //get the team data for this list.
                        for (var i = 0; i < values.length; i++) {
                            for (var j = 0; j < values[i].length; j++) {
                                districtTeamsAll.push(values[i][j]);
                            }
                        }
                        districtTeamsAll.sort(function (a, b) {
                            return parseInt(a.teamNumber) - parseInt(b.teamNumber);
                        });
                        districtTeams = uniq(districtTeamsAll);
                        localStorage.districtTeamList = JSON.stringify(districtTeams);
                        var teamDataLoadPromises = [];
                        for (var i = 0; i < districtTeams.length; i++) {
                            teamDataLoadPromises.push(new Promise((resolve, reject) => {
                                var req = new XMLHttpRequest();
                                req.open('GET', apiURL + localStorage.currentYear + '/teams?teamNumber=' + districtTeams[i].teamNumber);
                                req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
                                req.addEventListener('load', function () {
                                    if (req.responseText.substr(0, 5) !== '"Team') {
                                        var data = JSON.parse(req.responseText);
                                        if (data.teams.length > 0) {
                                            var teamData = data.teams[0];
                                            //console.log("getDistrictTeamData: " + i);
                                            //console.log(teamData);
                                            resolve(teamData);
                                        } else {
                                            reject(data);
                                        }

                                    }

                                });
                                req.send();
                            }));
                        }
                        Promise.all(teamDataLoadPromises).then(function (value) {
                            //finished
                            //console.log(value);
                            for (var i = 0; i < value.length; i++) {
                                var index = -1;
                                for (var ii = 0; ii < eventTeamList.length; ii++) {
                                    if (value[i].teamNumber === eventTeamList[ii].teamNumber) {
                                        index = ii;
                                    }

                                }
                                if (index < 0) {
                                    $('#teamsTableBody').append(generateTeamTableRow(value[i]));
                                    var team = decompressLocalStorage("teamData" + value[i].teamNumber);
                                    team.rank = "";
                                    team.alliance = "";
                                    team.allianceName = "";
                                    team.allianceChoice = "";
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
                                    compressLocalStorage("teamData" + value[i].teamNumber, team);
                                    highScores['"' + value[i].teamNumber + '.score"'] = 0;
                                    highScores['"' + value[i].teamNumber + '.description"'] = "";
                                    eventTeamList.push(value[i]);

                                }
                            }
                            localStorage.teamList = JSON.stringify(eventTeamList);
                            getTeamAwardsAsync(eventTeamList, year);
                            if (Number(localStorage.currentYear) >= 2018) {
                                getAvatars()
                            }
                            getHybridSchedule();
                            displayAwardsTeams();
                            lastSchedulePage = !0;
                        })
                            .catch(function (err) {
                                // Will catch failure of first failed promise
                                console.log("Failed:", err);
                            });

                    })
                        .catch(function (err) {
                            // Will catch failure of first failed promise
                            console.log("GetDistrictAwards Failed:", err);
                        });
                } else {
                    getTeamAwardsAsync(eventTeamList, year);
                    if (Number(localStorage.currentYear) >= 2018) {
                        getAvatars()
                    }
                    getHybridSchedule();
                    displayAwardsTeams();
                    lastSchedulePage = !0
                }


            }
            $("#teamUpdateContainer").html(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"))
            getTeamAppearances(eventTeamList);
        }
    });
    req.send()
}

function getAvatars() {
    "use strict";
    var req = new XMLHttpRequest();
    req.open('GET', apiURL + localStorage.currentYear + '/avatars/' + localStorage.currentEvent);
    req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req.addEventListener('load', function () {
        if (req.status === 200) {

            var data = JSON.parse(req.responseText);
            var teamData = {};
            for (var i = 0; i < data.teams.length; i++) {
                if (typeof localStorage["teamData" + data.teams[i].teamNumber] !== "undefined") {
                    teamData = decompressLocalStorage("teamData" + data.teams[i].teamNumber);
                    if (data.teams[i].encodedAvatar !== null) {
                        teamData.avatar = data.teams[i].encodedAvatar;
                        $("#avatar" + data.teams[i].teamNumber).html('<img src="https://www.gatool.org/' + data.teams[i].encodedAvatar + '">&nbsp;')
                    } else {
                        teamData.avatar = "null";
                        $("#avatar" + data.teams[i].teamNumber).html("")
                    }
                    compressLocalStorage("teamData" + data.teams[i].teamNumber, teamData)
                }
            }
        }
    });
    req.send()
}

function getTeamAwardsAsync(teamList, currentYear) {
    "use strict";
    var teamAwardRequests = [];
    teamList.forEach((item, index) => {
        teamAwardRequests.push(new Promise((resolve, reject) => {
            getTeamAwards(item.teamNumber, currentYear);
            resolve()
        }))
    });
    Promise.all(teamAwardRequests).then((value) => {
    })
}

function handlePlayoffBracket() {
    $(".overtime").hide();
    $(".playoffScore").html("–");
    var matchArray = JSON.parse(localStorage.playoffList).Schedule;
    for (var i = 0; i < matchArray.length; i++) {
        processPlayoffBracket(matchArray[i]);
        if ((i < Object.keys(playoffResultsDetails).length) && (matchArray[i].scoreRedFinal !== null) && (playoffResultsDetails[matchArray[i].matchNumber].winner === "tie") && (matchArray[i].description.split(" ")[0] !== "Final")) {
            var winner = {};
            winner.winner = playoffResultsDetails[matchArray[i].matchNumber].tiebreaker;
            winner.class = "";
            winner.level = playoffResultsDetails[matchArray[i].matchNumber].tiebreakerLevel;
            if (winner.winner === "Red") {
                winner.class = "redScoreWin";
            } else if (winner.winner === "Blue") {
                winner.class = "blueScoreWin";
            }

            $("#bracketMatch" + matchArray[i].matchNumber + winner.winner + "Score").addClass(winner.class);
            $("#bracketMatch" + matchArray[i].matchNumber + winner.winner + "Score").html($("#bracketMatch" + matchArray[i].matchNumber + winner.winner + "Score").html() + " (L" + winner.level + ")");
        }

    }
}

function handlePlayoffBracket2() {
    $(".overtime").hide();
    $(".playoffScore").html("–");
    var matchArray = JSON.parse(localStorage.playoffList).Schedule;
    for (var i = 0; i < matchArray.length; i++) {
        processPlayoffBracket(matchArray[i]);
        if (playoffTieBreakerMatches["list"].includes(String(matchArray[i].matchNumber))) {
            var winner = {};
            winner.alliance = "";
            winner.level = 0;
            for (matchesToAdd = 0; matchesToAdd < playoffTieBreakerMatches[String(matchArray[i].matchNumber)].length; matchesToAdd++) {
                winner.red = 0;
                winner.blue = 0;
                for (var ii = 0; ii < 5; ii++) {
                    winner.level = ii + 1;
                    var criterion = playoffTiebreakers[localStorage.currentYear][ii].split("+");
                    for (var a = 0; a < criterion.length; a++) {
                        winner.red += Number(playoffResultsDetails[String(matchArray[i].matchNumber)].alliances[1][criterion[a]])
                        winner.blue += Number(playoffResultsDetails[String(matchArray[i].matchNumber)].alliances[0][criterion[a]])
                    }
                    if (winner.red > winner.blue) {
                        winner.alliance = "red";
                        break;
                    } else if (winner.red < winner.blue) {
                        winner.alliance = "blue";
                        break;
                    }
                }
                if (winner.alliance !== "") {
                    break;
                }
            }
            //console.log(matchArray[i].description);
            //console.log(winner);
        }

    }
}

function getAllianceList() {
    "use strict";
    $("#allianceUpdateContainer").html("Loading Alliance data...");
    var req2 = new XMLHttpRequest();
    req2.open('GET', apiURL + localStorage.currentYear + '/alliances/' + localStorage.currentEvent);
    req2.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req2.addEventListener('load', function () {
        if (req2.status === 200) {
            var data = JSON.parse(req2.responseText);
            if (data.Alliances.length === 0) {
                $('#allianceUpdateContainer').html('<b>No Playoff Alliance data available for this event.</b>');
                localStorage.Alliances = {}
            } else {
                localStorage.Alliances = JSON.stringify(data);
                for (var i = 0; i < data.Alliances.length; i++) {
                    var element = data.Alliances[i];
                    var team = {};
                    if (element.captain !== null) {
                        team = decompressLocalStorage("teamData" + element.captain);
                        team.alliance = element.number;
                        team.allianceName = element.name;
                        team.allianceChoice = "Captain";
                        compressLocalStorage("teamData" + element.captain, team)
                    }
                    if (element.round1 !== null) {
                        team = decompressLocalStorage("teamData" + element.round1);
                        team.alliance = element.number;
                        team.allianceName = element.name;
                        team.allianceChoice = "Round 1 Selection";
                        compressLocalStorage("teamData" + element.round1, team)
                    }
                    if (element.round2 !== null) {
                        team = decompressLocalStorage("teamData" + element.round2);
                        team.alliance = element.number;
                        team.allianceName = element.name;
                        team.allianceChoice = "Round 2 Selection";
                        compressLocalStorage("teamData" + element.round2, team)
                    }
                    if (element.round3 !== null) {
                        team = decompressLocalStorage("teamData" + element.round3);
                        team.alliance = element.number;
                        team.allianceName = element.name;
                        team.allianceChoice = "Round 3 Selection";
                        compressLocalStorage("teamData" + element.round3, team)
                    }
                    if (element.backup !== null) {
                        team = decompressLocalStorage("teamData" + element.backup);
                        team.alliance = element.number;
                        team.allianceName = element.name;
                        team.allianceChoice = "Backup Robot replacing " + element.backupReplaced;
                        compressLocalStorage("teamData" + element.backup, team)
                    }
                }
            }
            if (haveSchedule) {
                announceDisplay();
                handlePlayoffBracket();
            }
            $("#allianceUpdateContainer").html(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"))
        }
    });
    if (localStorage.inPlayoffs === "true") {
        req2.send()
    } else {
        if (haveSchedule) {
            announceDisplay()
        }
    }
}

function updateMatchResults() {
    "use strict";
    getHybridSchedule();
    document.getElementById("matchPicker" + localStorage.currentMatch).selected = !0;
    $("#matchPicker").selectpicker('refresh')
}

function getNextMatch() {
    "use strict";
    var qualsList = JSON.parse(localStorage.qualsList);
    var playoffList = JSON.parse(localStorage.playoffList);
    replacementAlliance = {};
    if (!qualsList) {
        $("#matchNumber").html("No matches scheduled.")
    } else {
        localStorage.currentMatch++;
        if (localStorage.currentMatch > qualsList.Schedule.length + playoffList.Schedule.length) {
            localStorage.currentMatch = qualsList.Schedule.length + playoffList.Schedule.length
        }
        announceDisplay();
        updateMatchResults()
    }
}

function getPreviousMatch() {
    "use strict";
    replacementAlliance = {};
    localStorage.currentMatch--;
    if (localStorage.currentMatch < 1) {
        localStorage.currentMatch = 1
    }
    announceDisplay();
    updateMatchResults()
}

function announceDisplay() {
    "use strict";
    $("#davidPriceNumber").removeClass("redScore blueScore tieScore");
    $("#davidPriceAlliances").hide();
    var qualsList = JSON.parse(localStorage.qualsList);
    var currentMatch = localStorage.currentMatch - 1;
    var teamCount = 6;
    if (haveSchedule) {
        if (localStorage.currentMatch > qualsList.Schedule.length) {
            currentMatch = localStorage.currentMatch - qualsList.Schedule.length - 1;
            qualsList = JSON.parse(localStorage.playoffList)
        }
        currentMatchData = qualsList.Schedule[currentMatch];
        var stationList = ["red1", "red2", "red3", "blue1", "blue2", "blue3", "red4", "blue4"];
        var redTeams = [];
        var blueTeams = [];
        var alliances = JSON.parse(localStorage.Alliances).Alliances;
        var redAlliance = {};
        var blueAlliance = {};
        $(".champsDisplay").hide();
        if (inChamps() || (inSubdivision() && (localStorage.currentMatch > qualsList.Schedule.length))) {
            teamCount = 8;
            $(".champsDisplay").show();
            var red1 = currentMatchData.teams[0].teamNumber;
            var blue1 = currentMatchData.teams[3].teamNumber;
            redAlliance = $.grep(alliances, function (element, index) {
                return (element.captain === red1 || element.round1 === red1 || element.round2 === red1 || element.round3 === red1 || element.backup === red1)
            });
            redTeams = [redAlliance[0].captain, redAlliance[0].round1, redAlliance[0].round2, redAlliance[0].round3, redAlliance[0].backup];
            blueAlliance = $.grep(alliances, function (element, index) {
                return (element.captain === blue1 || element.round1 === blue1 || element.round2 === blue1 || element.round3 === blue1 || element.backup === blue1)
            });
            blueTeams = [blueAlliance[0].captain, blueAlliance[0].round1, blueAlliance[0].round2, blueAlliance[0].round3, blueAlliance[0].backup]
        }
        if ((currentMatchData.description.split(" ")[0] !== "Qualification") && (currentMatchData.description.split(" ")[0] !== "Einstein") && (Number(localStorage.currentYear) >= 2017)) {
            $("#matchNameAnnounce").html(parsePlayoffMatchName(currentMatchData.description));
            $("#topMatchNameAnnounce").html(localStorage.eventName + "<br>" + parsePlayoffMatchName(currentMatchData.description));
            $("#matchName").html(parsePlayoffMatchName(currentMatchData.description));
            $("#topMatchNamePlayByPlay").html(parsePlayoffMatchName(currentMatchData.description));
            $("#davidPriceNumber").html(davidPriceFormat(currentMatchData))
        } else {
            $("#matchNameAnnounce").html("<b>" + currentMatchData.description + " of " + qualsList.Schedule.length + "</b>");
            $("#topMatchNameAnnounce").html("<b>" + localStorage.eventName + "<br>" + currentMatchData.description + " of " + qualsList.Schedule.length + "</b>");
            $("#matchName").html("<b>" + currentMatchData.description + " of " + qualsList.Schedule.length + "</b>");
            $("#topMatchNamePlayByPlay").html("<b>" + currentMatchData.description + " of " + qualsList.Schedule.length + "</b>");
            $("#davidPriceNumber").html(davidPriceFormat(currentMatchData))
        }
        $("#eventHighScorePlayByPlay").html("<b>Current High Score: " + localStorage.matchHighScore + "<br>from " + localStorage.highScoreDetails + "</b>");
        getHighScores();

        function checkTeam(element) {
            return element !== currentMatchData.teams[ii].teamNumber
        }

        for (var ii = 0; ii < teamCount; ii++) {
            if (ii < 3) {
                redTeams = redTeams.filter(checkTeam)
            }
            if (ii < 6 && ii > 2) {
                blueTeams = blueTeams.filter(checkTeam)
            }
            if (ii === 6) {
                currentMatchData.teams[ii] = { "teamNumber": redTeams[0] }
            }
            if (ii === 7) {
                currentMatchData.teams[ii] = { "teamNumber": blueTeams[0] }
            }
            var teamData = decompressLocalStorage("teamData" + currentMatchData.teams[ii].teamNumber);
            $('#' + stationList[ii] + 'TeamNumber').html("<b>" + currentMatchData.teams[ii].teamNumber + "</b>");
            $('#' + stationList[ii] + 'PlaybyPlayteamNumber').html(currentMatchData.teams[ii].teamNumber);
            inHallOfFame(currentMatchData.teams[ii].teamNumber, stationList[ii]);
            if ((localStorage.currentMatch > qualsList.Schedule.length) || inChamps() || (inMiChamps() && (localStorage.currentYear >= 2017))) {
                document.getElementById(stationList[ii] + 'TeamNumber').setAttribute("onclick", "replaceTeam('" + stationList[ii] + "','" + currentMatchData.teams[ii].teamNumber + "')");
                document.getElementById(stationList[ii] + 'PlaybyPlayteamNumber').setAttribute("onclick", "replaceTeam('" + stationList[ii] + "','" + currentMatchData.teams[ii].teamNumber + "')")
            } else {
                document.getElementById(stationList[ii] + 'TeamNumber').setAttribute("onclick", "");
                document.getElementById(stationList[ii] + 'PlaybyPlayteamNumber').setAttribute("onclick", "")
            }
            if (replacementAlliance[stationList[ii]]) {
                teamData = decompressLocalStorage("teamData" + replacementAlliance[stationList[ii]]);
                $('#' + stationList[ii] + 'TeamNumber').html("<b>" + replacementAlliance[stationList[ii]] + "</b>");
                $('#' + stationList[ii] + 'PlaybyPlayteamNumber').html(replacementAlliance[stationList[ii]])
            }
            $('#' + stationList[ii] + 'RookieYear').html(rookieYearDisplay(teamData.rookieYear, teamData.teamYearsNoCompeteLocal));
            if ((localStorage.currentMatch > JSON.parse(localStorage.qualsList).Schedule.length) || inChamps() || (inMiChamps() && (localStorage.currentYear >= 2017))) {
                $('#' + stationList[ii] + 'Alliance').html(teamData.allianceName + "<br>" + teamData.allianceChoice);
                $('#' + stationList[ii] + 'PlayByPlayAlliance').html("<p><b>" + teamData.allianceName + "<br>" + teamData.allianceChoice + "<b></p>")
            } else {
                $('#' + stationList[ii] + 'Alliance').html("");
                $('#' + stationList[ii] + 'PlayByPlayAlliance').html("")
            }
            if (teamData.nameShortLocal === "") {
                $("#" + stationList[ii] + "TeamName").html(teamData.nameShort)
            } else {
                $("#" + stationList[ii] + "TeamName").html(teamData.nameShortLocal)
            }
            if (teamData.cityStateLocal === "") {
                $("#" + stationList[ii] + "CityState").html(teamData.cityState)
            } else {
                $("#" + stationList[ii] + "CityState").html(teamData.cityStateLocal)
            }
            if ((typeof teamData.showRobotName) === "undefined") {
                teamData.showRobotName = true;
            }
            if (teamData.showRobotName === true) {
                if (teamData.robotNameLocal === "") {
                    $("#" + stationList[ii] + "RobotName").html(teamData.robotName)
                } else {
                    $("#" + stationList[ii] + "RobotName").html(teamData.robotNameLocal)
                }
            } else {
                $("#" + stationList[ii] + "RobotName").html("")
            }
            if (teamData.teamMottoLocal === "") {
                $("#" + stationList[ii] + "Motto").html("")
            } else {
                $("#" + stationList[ii] + "Motto").html('<b>Motto: "' + teamData.teamMottoLocal + '"</b>')
            }
            if (teamData.organizationLocal === "") {
                $("#" + stationList[ii] + "Organization").html(teamData.organization)
            } else {
                $("#" + stationList[ii] + "Organization").html(teamData.organizationLocal)
            }
            if (teamData.topSponsorsLocal === "") {
                $("#" + stationList[ii] + "Sponsors").html(teamData.topSponsors)
            } else {
                $("#" + stationList[ii] + "Sponsors").html(teamData.topSponsorsLocal)
            }
            if (teamData.awardsLocal === "") {
                $("#" + stationList[ii] + "Awards").html(teamData.awards)
            } else {
                $("#" + stationList[ii] + "Awards").html(teamData.awardsLocal)
            }
            $("#" + stationList[ii] + "Rank").html(teamData.rank);
            if (inChamps() || (inMiChamps() && (localStorage.currentYear >= 2017)) || (inSubdivision() && (localStorage.currentMatch > qualsList.Schedule.length))) {
                $('#' + stationList[ii] + 'PlayByPlayAlliance').html("");
                $("#" + stationList[ii] + "WinLossTie").html("<p class='playByPlayChampsAlliance'>" + teamData.allianceName + "<br>" + teamData.allianceChoice + "</p>");
                rankHighlight(stationList[ii] + "Rank", teamData.rank)
            } else {
                $("#" + stationList[ii] + "WinLossTie").html("<table class='wltTable'><tr><td id='" + stationList[ii] + "PlayByPlayRank' class='wltCol'>Rank " + teamData.rank + "<br>AV RP " + teamData.sortOrder1 + "</td><td class='wltCol'>Qual Avg<br>" + teamData.qualAverage + "</td><td class='wltCol'>W-L-T<br>" + teamData.wins + "-" + teamData.losses + "-" + teamData.ties + "</td></tr><tr><td colspan='3'>Team high score: " + highScores['"' + currentMatchData.teams[ii].teamNumber + '.score"'] + "<br>in " + highScores['"' + currentMatchData.teams[ii].teamNumber + '.description"'] + "</td></tr></table>");
                rankHighlight(stationList[ii] + "PlayByPlayRank", teamData.rank);
                rankHighlight(stationList[ii] + "Rank", teamData.rank)
            }
            if (teamData.nameShortLocal === "") {
                $('#' + stationList[ii] + 'PlaybyPlayTeamName').html(teamData.nameShort)
            } else {
                $('#' + stationList[ii] + 'PlaybyPlayTeamName').html(teamData.nameShortLocal)
            }
            if (teamData.showRobotName === true) {
                if (teamData.robotNameLocal === "") {
                    $('#' + stationList[ii] + 'PlaybyPlayRobotName').html(teamData.robotName)
                } else {
                    $('#' + stationList[ii] + 'PlaybyPlayRobotName').html(teamData.robotNameLocal)
                }
            } else {
                $('#' + stationList[ii] + 'PlaybyPlayRobotName').html("")
            }
            if (teamData.cityStateLocal === "") {
                $("#" + stationList[ii] + "PlayByPlayCity").html(teamData.cityState)
            } else {
                $("#" + stationList[ii] + "PlayByPlayCity").html(teamData.cityStateLocal)
            }
            if (teamData.organizationLocal === "") {
                $("#" + stationList[ii] + "PlayByPlayOrganization").html(teamData.organization)
            } else {
                $("#" + stationList[ii] + "PlayByPlayOrganization").html(teamData.organizationLocal)
            }
            if (teamData.teamMottoLocal === "") {
                $("#" + stationList[ii] + "PlayByPlayMotto").html("")
            } else {
                $("#" + stationList[ii] + "PlayByPlayMotto").html('Motto: "' + teamData.teamMottoLocal + '"')
            }
            if (teamData.teamNotesLocal === "") {
                $("#" + stationList[ii] + "Notes").html("");
                $("#" + stationList[ii] + "PlaybyPlayNotes").html("")
            } else {
                $("#" + stationList[ii] + "Notes").html('Notes: "' + teamData.teamNotesLocal + '"');
                $("#" + stationList[ii] + "PlaybyPlayNotes").html('Notes: "' + teamData.teamNotesLocal + '"')
            }
            var appearanceDisplay = "";
            if ((inChamps() || inSubdivision()) && localStorage.showChampsStats === "true") {

                var appearanceData = eventAppearances[String(currentMatchData.teams[ii].teamNumber)];
                var allAwardsData = champsAwards[String(currentMatchData.teams[ii].teamNumber)];
                if (typeof appearanceData !== "undefined") {
                    if (appearanceData.champsAppearances === 1) {
                        appearanceDisplay += "<b>1 Champs Appearance</b><br>";
                    }
                    if (appearanceData.champsAppearances > 1) {
                        appearanceDisplay += "<b>" + appearanceData.champsAppearances + " Champs Appearances</b><br>";
                    }
                    if (appearanceData.champsAppearancesyears.length > 0) {
                        appearanceDisplay += appearanceData.champsAppearancesyears.join(", ") + "<br>";
                    }
                    if (appearanceData.einsteinAppearances === 1) {
                        appearanceDisplay += "<b>1 Einstein Appearance</b><br>";
                    }
                    if (appearanceData.einsteinAppearances > 1) {
                        appearanceDisplay += "<b>" + appearanceData.einsteinAppearances + " Einstein Appearances</b><br>";
                    }
                    if (appearanceData.einsteinAppearancesyears.length > 0) {
                        appearanceDisplay += appearanceData.einsteinAppearancesyears.join(", ") + "<br>";
                    }
                    if (appearanceData.FOCAppearances === 1) {
                        appearanceDisplay += "<b>Festival of Champions team</b><br>";
                    }
                    if (appearanceData.FOCAppearances > 1) {
                        appearanceDisplay += "<b>" + appearanceData.FOCAppearances + " FOC Appearances</b><br>";
                    }
                    if (appearanceData.FOCAppearancesyears.length > 0) {
                        appearanceDisplay += appearanceData.FOCAppearancesyears.join(", ") + "<br>";
                    }
                }
                if (typeof allAwardsData !== "undefined") {
                    if (allAwardsData.chairmans > 0) {
                        appearanceDisplay += "<b>Chairman's Award</b><br> "+allAwardsData.chairmansyears.join(", ") + "<br>";
                    }
                    if (allAwardsData.champsFinalist === 1) {
                        appearanceDisplay += "<b>Champs Finalist</b><br>";
                    }
                    if (allAwardsData.champsFinalist > 1) {
                        appearanceDisplay += "<b>" + allAwardsData.champsFinalist + " time Champs Finalist</b><br>";
                    }
                    if (allAwardsData.champsFinalistyears.length > 0) {
                        appearanceDisplay += allAwardsData.champsFinalistyears.join(", ") + "<br>";
                    }
                    if (allAwardsData.champsSubdivisionWinner === 1) {
                        appearanceDisplay += "<b>Subdivision Winner</b><br>";
                    }
                    if (allAwardsData.champsSubdivisionWinner > 1) {
                        appearanceDisplay += "<b>" + allAwardsData.champsSubdivisionWinner + " time Subdivision Winner</b><br>";
                    }
                    if (allAwardsData.champsSubdivisionWinneryears.length > 0) {
                        appearanceDisplay += allAwardsData.champsSubdivisionWinneryears.join(", ") + "<br>";
                    }
                    if (allAwardsData.woodieflowers === 1) {
                        appearanceDisplay += "<b>Woodie Flowers Awardee</b><br>";
                    }
                    if (allAwardsData.woodieflowers > 1) {
                        appearanceDisplay += "<b>" + allAwardsData.woodieflowers + " Woodie Flowers Awardees</b><br>";
                    }
                    if (allAwardsData.woodieflowersyears.length > 0) {
                        appearanceDisplay += allAwardsData.woodieflowersyears.join(", ") + "<br>";
                    }

                }
            }

            $("#" + stationList[ii] + "Champs").html(appearanceDisplay);

        }
        if ((localStorage.currentMatch > JSON.parse(localStorage.qualsList).Schedule.length) || inChamps() || (inMiChamps() && (localStorage.currentYear >= 2017))) {
            if (inChamps() || inMiChamps()) {
                $('#davidPriceRedAlliance').html(allianceShortNames[$("#red1Alliance").html().split("<br>")[0]]);
                $('#davidPriceBlueAlliance').html(allianceShortNames[$("#blue1Alliance").html().split("<br>")[0]])
            } else {
                $('#davidPriceRedAlliance').html($("#red1Alliance").html().split("<br>")[0].split(" ")[1]);
                $('#davidPriceBlueAlliance').html($("#blue1Alliance").html().split("<br>")[0].split(" ")[1])
            }
            $('#davidPriceAlliances').show()
        }
        getTeamRanks();
        displayAwards();
    }
}

function replaceTeam(station, originalTeam) {
    "use strict";
    var replacementTeam = originalTeam;
    var message = "You are about to replace Alliance team <b>" + originalTeam + "</b> for another team.<br>";
    message += "This is a one-time replacement, since the substitution will be recorded at FIRST when the match ends and the score is committed.";
    message += '<div id = "substituteTeamInput" class="form-group"><label for="substituteTeamUpdate">Substitute Team Entry</label><input type="text" class="form-control" id="substituteTeamUpdate" placeholder="Enter a Team Number"></div>';
    BootstrapDialog.show({
        type: 'type-success',
        title: '<b>Alliance Team ' + originalTeam + ' Substitution</b>',
        message: message,
        buttons: [{
            label: 'Make it so!',
            icon: 'glyphicon glyphicon-tower',
            hotkey: 13,
            cssClass: "btn btn-success",
            action: function (dialogRef) {
                dialogRef.close();
                if ($("#substituteTeamUpdate").val()) {
                    replacementTeam = $("#substituteTeamUpdate").val();
                    if (allianceListUnsorted.indexOf(parseInt(replacementTeam)) >= 0) {
                        replacementAlliance[station] = replacementTeam
                    } else {
                        BootstrapDialog.show({
                            type: 'type-warning',
                            title: '<b>Alliance Team ' + originalTeam + ' Substitution</b>',
                            message: "<b>" + replacementTeam + "<b> not found in the event.",
                            buttons: [{
                                label: 'Rats!',
                                icon: 'glyphicon glyphicon-tower',
                                hotkey: 13,
                                cssClass: "btn btn-warning",
                                action: function (dialogRef) {
                                    dialogRef.close()
                                }
                            }]
                        })
                    }
                }
                announceDisplay()
            }
        }]
    })
}

function displayAwardsTeams(teamList) {
    "use strict";
    var column = 1;
    var sortedTeams = [];
    teamList = JSON.parse(localStorage.teamList);
    for (var j = 0; j < teamList.length; j++) {
        sortedTeams[j] = Number(teamList[j].teamNumber)
    }
    $("#awardsTeamList1").html("");
    $("#awardsTeamList2").html("");
    $("#awardsTeamList3").html("");
    $("#awardsTeamList4").html("");
    $("#awardsTeamList5").html("");
    $("#awardsTeamList6").html("");
    sortedTeams.sort(function (a, b) {
        return a - b;
    });
    for (var i = 0; i < sortedTeams.length; i++) {
        if (i < sortedTeams.length / 6) {
            column = "1"
        } else if (i >= sortedTeams.length / 6 && i < sortedTeams.length * 2 / 6) {
            column = "2"
        } else if (i >= sortedTeams.length * 2 / 6 && i < sortedTeams.length * 3 / 6) {
            column = "3"
        } else if (i >= sortedTeams.length * 3 / 6 && i < sortedTeams.length * 4 / 6) {
            column = "4"
        } else if (i >= sortedTeams.length * 4 / 6 && i < sortedTeams.length * 5 / 6) {
            column = "5"
        } else {
            column = "6"
        }
        $("#awardsTeamList" + column).append("<div class ='awardAllianceTeam' onclick='awardsAlert(this)' teamnumber='" + sortedTeams[i] + "' id='awardsAllianceTeam" + sortedTeams[i] + "'>" + sortedTeams[i] + "</div></br>")
    }
}

function displayAllianceCaptains(startingPosition) {
    "use strict";

    for (var i = 1; i <= 8; i++) {
        if (i <= startingPosition + 1) {
            $("#Alliance" + i + "Captain").html("Alliance " + i + " Captain<div class ='allianceTeam allianceCaptain' captain='Alliance" + i + "Captain' teamnumber='" + allianceChoices["Alliance" + i + "Captain"] + "' id='allianceTeam" + allianceChoices["Alliance" + i + "Captain"] + "' onclick='chosenAllianceAlert(this)'>" + allianceChoices["Alliance" + i + "Captain"] + "</div>")
        } else {
            $("#Alliance" + i + "Captain").html("Alliance " + i + " Captain<div class ='allianceTeam allianceCaptain' captain='Alliance" + i + "Captain' teamnumber='" + allianceChoices["Alliance" + i + "Captain"] + "' id='allianceTeam" + allianceChoices["Alliance" + i + "Captain"] + "' onclick='allianceAlert(this)'>" + allianceChoices["Alliance" + i + "Captain"] + "</div>")
        }
    }
}

function displayBackupAlliances(reason) {
    for (var i = 0; i < declinedList.length; i++) {
        if (backupAllianceList.indexOf(Number(declinedList[i])) >= 0) {
            backupAllianceList.splice(backupAllianceList.indexOf(Number(declinedList[i])), 1);
        }
    }

    for (var i = 1; i <= 8; i++) {
        if (i <= backupAllianceList.length) {
            $("#backupAllianceTeam" + i).html("<div id='backupAllianceTeamContainer" + i + "' class ='allianceTeam' captain='alliance' teamnumber=" + backupAllianceList[i - 1] + " onclick='allianceAlert(this)'>" + backupAllianceList[i - 1] + "</div>");
        }

    }
}

function sortAllianceTeams(teamList) {
    "use strict";
    var column = 1;
    $("#allianceTeamList1").html("");
    $("#allianceTeamList2").html("");
    $("#allianceTeamList3").html("");
    $("#allianceTeamList4").html("");
    $("#allianceTeamList5").html("");
    teamList.sort(function (a, b) {
        return a - b
    });
    for (var i = 0; i < teamList.length; i++) {
        if (i < teamList.length / 5) {
            column = "1"
        } else if (i > teamList.length / 5 && i <= teamList.length * 2 / 5) {
            column = "2"
        } else if (i > teamList.length * 2 / 5 && i <= teamList.length * 3 / 5) {
            column = "3"
        } else if (i > teamList.length * 3 / 5 && i <= teamList.length * 4 / 5) {
            column = "4"
        } else {
            column = "5"
        }
        $("#allianceTeamList" + column).append("<div class ='allianceTeam' onclick='allianceAlert(this)' captain='alliance' teamnumber='" + teamList[i] + "' id='allianceTeam" + teamList[i] + "'>" + teamList[i] + "</div></br>")
    }
    for (var i = 0; i < declinedList.length; i++) {
        document.getElementById("allianceTeam" + declinedList[i]).setAttribute("declined", "true");
        document.getElementById("allianceTeam" + declinedList[i]).classList.add("allianceDeclined");
    }
    return teamList;
}

function allianceAlert(teamContainer) {
    "use strict";
    var teamNumber = teamContainer.getAttribute("teamnumber");
    var declined = teamContainer.getAttribute("declined");
    var currentTeamInfo = decompressLocalStorage("teamData" + teamNumber);
    var selectedTeamInfo = "<span class = 'allianceAnnounceDialog'>Team " + teamNumber + " ";
    if (currentTeamInfo.nameShortLocal === "") {
        selectedTeamInfo += currentTeamInfo.nameShort
    } else {
        selectedTeamInfo += currentTeamInfo.nameShortLocal
    }
    if (declined !== "true") {
        selectedTeamInfo += "<br> is from ";
        if (currentTeamInfo.organizationLocal === "") {
            selectedTeamInfo += currentTeamInfo.organization
        } else {
            selectedTeamInfo += currentTeamInfo.organizationLocal
        }
        selectedTeamInfo += "<br>in ";
        if (currentTeamInfo.cityStateLocal === "") {
            selectedTeamInfo += currentTeamInfo.cityState
        } else {
            selectedTeamInfo += currentTeamInfo.cityStateLocal
        }
    } else {
        selectedTeamInfo += "<br>has previously declined an offer, so they are not elegible at this time.";
    }
    selectedTeamInfo += "</span>";
    if (declined === "true") {
        BootstrapDialog.show({
            type: 'type-warning',
            title: '<b>Ineligible Team</b>',
            message: selectedTeamInfo,
            buttons: [{
                label: 'OK',
                icon: 'glyphicon glyphicon-thumbs-down',
                hotkey: 13,
                cssClass: "btn btn-success",
                action: function (dialogRef) {
                    dialogRef.close()
                }
            }]
        })
    } else {
        BootstrapDialog.show({
            type: 'type-success',
            title: '<b>Alliance Choice</b>',
            message: selectedTeamInfo,
            buttons: [{
                icon: 'glyphicon glyphicon-tower',
                cssClass: "btn btn-primary",
                label: 'Alliance Captain Announce',
                hotkey: 65,
                action: function (dialogRef) {
                    dialogRef.close()
                }
            }, {
                icon: 'glyphicon glyphicon-thumbs-down',
                cssClass: "btn btn-danger",
                label: 'Respectfully Decline',
                hotkey: 68,
                action: function (dialogRef) {
                    dialogRef.close();
                    BootstrapDialog.show({
                        type: 'type-warning',
                        title: '<b>Team Declines the offer</b>',
                        message: "<span class = 'allianceAnnounceDialog'>Team " + teamNumber + " is about to decline an offer to join an alliance. Are you sure?<br>They will become inelegible to be selected by another team or to continue as a backup team in the playoffs.",
                        buttons: [{
                            label: "Sorry, they don't decline the offer",
                            icon: 'glyphicon glyphicon-tower',
                            hotkey: 13,
                            cssClass: "btn btn-success",
                            action: function (dialogRef) {
                                dialogRef.close();
                            }
                        }, {
                            label: 'THEY DECLINE THE OFFER',
                            icon: 'glyphicon glyphicon-thumbs-down',
                            hotkey: 13,
                            cssClass: "btn btn-danger",
                            action: function (dialogRef) {
                                dialogRef.close();
                                declinedListUndo.push(JSON.stringify(declinedList));
                                allianceChoicesUndo.push(JSON.stringify(allianceChoices));
                                allianceListUnsortedUndo.push(JSON.stringify(allianceListUnsorted));
                                allianceTeamListUndo.push(JSON.stringify(allianceTeamList));
                                allianceSelectionTableUndo.push($("#allianceSelectionTable").html());
                                declinedList.push(teamNumber);
                                backupAllianceListUndo.push(JSON.stringify(backupAllianceList));
                                $("#" + teamContainer.getAttribute("id")).addClass("allianceDeclined");
                                $("#" + teamContainer.getAttribute("id")).attr("declined", "true");
                                $("#allianceUndoButton").attr("onclick", "undoAllianceSelection()");
                                $("#allianceUndoButton").show();
                                sortAllianceTeams(allianceTeamList);
                                displayBackupAlliances("decline");
                                undoCounter.push("decline");
                            }
                        }
                        ]
                    })
                }
            }, {
                icon: 'glyphicon glyphicon-thumbs-up',
                cssClass: "btn btn-success",
                hotkey: 13,
                label: 'Gratefully Accept',
                action: function (dialogRef) {
                    dialogRef.close();
                    BootstrapDialog.show({
                        type: 'type-success',
                        title: '<b>Are you sure they want to accept?</b>',
                        message: "<span class = 'allianceAnnounceDialog'>Are you certain that Team " + teamNumber + " accepts the offer?</span>",
                        buttons: [{
                            icon: 'glyphicon glyphicon-thumbs-down',
                            label: 'No, they did not accept.',
                            hotkey: 78,
                            cssClass: "btn btn-danger",
                            action: function (dialogRef) {
                                dialogRef.close()
                            }
                        }, {
                            icon: 'glyphicon glyphicon-thumbs-up',
                            cssClass: "btn btn-success",
                            label: 'Gratefully Accept',
                            hotkey: 13,
                            action: function (dialogRef) {
                                dialogRef.close();
                                allianceChoicesUndo.push(JSON.stringify(allianceChoices));
                                allianceListUnsortedUndo.push(JSON.stringify(allianceListUnsorted));
                                allianceTeamListUndo.push(JSON.stringify(allianceTeamList));
                                declinedListUndo.push(JSON.stringify(declinedList));
                                backupAllianceListUndo.push(JSON.stringify(backupAllianceList));
                                allianceSelectionTableUndo.push($("#allianceSelectionTable").html());
                                $("#allianceUndoButton").attr("onclick", "undoAllianceSelection()");
                                $("#allianceUndoButton").show();
                                allianceChoices[allianceSelectionOrder[currentAllianceChoice]] = Number(teamNumber);
                                var reducedAllianceListUnsorted = allianceListUnsorted;

                                var index = allianceListUnsorted.indexOf(parseInt(teamNumber));
                                if (index > -1) {
                                    allianceListUnsorted.splice(index, 1)
                                }
                                index = allianceTeamList.indexOf(parseInt(teamNumber));
                                if (index > -1) {
                                    allianceTeamList.splice(index, 1)
                                }
                                index = backupAllianceList.indexOf(parseInt(teamNumber));
                                if (index > -1) {
                                    backupAllianceList.splice(index, 1)
                                }
                                if (teamContainer.getAttribute("captain") !== "alliance") {
                                    var allianceBackfill = teamContainer.getAttribute("captain");
                                    teamContainer.setAttribute("captain", "alliance");
                                    var nextAlliance = parseInt(allianceBackfill.substr(8, 1));

                                    for (var j = nextAlliance; j < 8; j++) {
                                        allianceChoices["Alliance" + j + "Captain"] = Number(allianceChoices["Alliance" + (j + 1) + "Captain"])
                                    }
                                    //test for declined team
                                    //allianceChoices.Alliance8Captain = allianceListUnsorted[7];
                                    allianceChoices.Alliance8Captain = backupAllianceList[0];

                                    index = allianceTeamList.indexOf(parseInt(allianceChoices.Alliance8Captain));
                                    if (index > -1) {
                                        allianceTeamList.splice(index, 1)
                                    }
                                    index = backupAllianceList.indexOf(parseInt(allianceChoices.Alliance8Captain));
                                    if (index > -1) {
                                        backupAllianceList.splice(index, 1)
                                    }
                                    index = allianceListUnsorted.indexOf(parseInt(allianceChoices.Alliance8Captain));
                                    if (index > -1) {
                                        allianceListUnsorted.splice(index, 1)
                                    }
                                }
                                teamContainer.removeAttribute("onclick");
                                teamContainer.setAttribute("onclick", "chosenAllianceAlert(this)");
                                teamContainer.id = "allianceTeam" + teamContainer.getAttribute("teamNumber");
                                $("#" + teamContainer.getAttribute("id")).removeClass("allianceCaptain");
                                $("#" + allianceSelectionOrder[currentAllianceChoice]).append(teamContainer);
                                $("#" + allianceSelectionOrder[currentAllianceChoice].substr(0, 9)).removeClass("dropzone");
                                $("#" + allianceSelectionOrder[currentAllianceChoice]).removeClass("nextAllianceChoice");
                                currentAllianceChoice++;
                                if (currentAllianceChoice <= allianceSelectionLength) {
                                    $("#" + allianceSelectionOrder[currentAllianceChoice].slice(0, 9)).addClass("dropzone");
                                    $("#" + allianceSelectionOrder[currentAllianceChoice]).addClass("nextAllianceChoice")
                                }
                                teamContainer.textContent = teamNumber;
                                displayAllianceCaptains(currentAllianceChoice);
                                displayBackupAlliances("accept");
                                sortAllianceTeams(allianceTeamList);
                                if (currentAllianceChoice === parseInt((allianceSelectionLength + 1))) {
                                    localStorage.allianceNoChange = "true";
                                    for (var k = 0; k < eventTeamList.length; k++) {
                                        document.getElementById("allianceTeam" + eventTeamList[k].teamNumber).setAttribute("onclick", "chosenAllianceAlert(this)")
                                    }
                                    for (k = 1; k <= 8; k++) {
                                        document.getElementById("backupAllianceTeamContainer" + k).setAttribute("onclick", "chosenAllianceAlert(this)")
                                    }
                                }
                                undoCounter.push("accept");

                            }
                        }]
                    })
                }
            }]
        })
    }
}

function undoAllianceSelection() {
    "use strict";
    var reason = undoCounter.pop();
    declinedList = JSON.parse(declinedListUndo.pop());
    allianceChoices = JSON.parse(allianceChoicesUndo.pop());
    allianceListUnsorted = JSON.parse(allianceListUnsortedUndo.pop());
    allianceTeamList = JSON.parse(allianceTeamListUndo.pop());
    backupAllianceList = JSON.parse(backupAllianceListUndo.pop());
    $("#allianceSelectionTable").html(allianceSelectionTableUndo.pop());
    $("#allianceUndoButton").attr("onclick", "undoAllianceSelection()");
    if (reason === "accept") { currentAllianceChoice = currentAllianceChoice - 1; }
    if (undoCounter.length === 0) {
        $("#allianceUndoButton").attr("onclick", "");
        $("#allianceUndoButton").hide();
    }
}

function awardsAlert(teamContainer) {
    "use strict";
    var teamNumber = teamContainer.getAttribute("teamnumber");
    var captain = teamContainer.getAttribute("captain");
    var currentTeamInfo = decompressLocalStorage("teamData" + teamNumber);
    var selectedTeamInfo = "<span class = 'allianceAnnounceDialog'>Team " + teamNumber + " ";
    var rookieTag = rookieYearDisplay(currentTeamInfo.rookieYear, currentTeamInfo.teamYearsNoCompeteLocal).trim();
    rookieTag = rookieTag.substring(6, rookieTag.length - 1);
    if (currentTeamInfo.nameShortLocal === "") {
        selectedTeamInfo += currentTeamInfo.nameShort
    } else {
        selectedTeamInfo += currentTeamInfo.nameShortLocal
    }
    selectedTeamInfo += "<br> is from ";
    if (currentTeamInfo.organizationLocal === "") {
        selectedTeamInfo += currentTeamInfo.organization
    } else {
        selectedTeamInfo += currentTeamInfo.organizationLocal
    }
    selectedTeamInfo += "<br>in ";
    if (currentTeamInfo.cityStateLocal === "") {
        selectedTeamInfo += currentTeamInfo.cityState + "<br>"
    } else {
        selectedTeamInfo += currentTeamInfo.cityStateLocal + "<br>"
    }
    if (originalAndSustaining.indexOf(teamNumber) > 0) {
        selectedTeamInfo += "<br>An Original and Sustaining Team founded in "
    } else {
        selectedTeamInfo += "<br>Founded in "
    }
    selectedTeamInfo += currentTeamInfo.rookieYear + ", this is their " + rookieTag + " competing with FIRST.</span>";
    BootstrapDialog.show({
        type: 'type-success',
        title: '<b>Awards Announcement</b>',
        message: selectedTeamInfo,
        buttons: [{
            label: 'Congratulations!',
            icon: 'glyphicon glyphicon-tower',
            hotkey: 13,
            cssClass: "btn btn-success",
            action: function (dialogRef) {
                dialogRef.close()
            }
        }]
    })
}

function chosenAllianceAlert(teamContainer) {
    "use strict";
    var teamNumber = teamContainer.getAttribute("teamnumber");
    var captain = teamContainer.getAttribute("captain");
    var currentTeamInfo = decompressLocalStorage("teamData" + teamNumber);
    var selectedTeamInfo = "<span class = 'allianceAnnounceDialog'>Team " + teamNumber + " ";
    var rookieTag = rookieYearDisplay(currentTeamInfo.rookieYear, currentTeamInfo.teamYearsNoCompeteLocal).trim();
    rookieTag = rookieTag.substring(6, rookieTag.length - 1);
    if (currentTeamInfo.nameShortLocal === "") {
        selectedTeamInfo += currentTeamInfo.nameShort
    } else {
        selectedTeamInfo += currentTeamInfo.nameShortLocal
    }
    selectedTeamInfo += "<br> is from ";
    if (currentTeamInfo.organizationLocal === "") {
        selectedTeamInfo += currentTeamInfo.organization
    } else {
        selectedTeamInfo += currentTeamInfo.organizationLocal
    }
    selectedTeamInfo += "<br>in ";
    if (currentTeamInfo.cityStateLocal === "") {
        selectedTeamInfo += currentTeamInfo.cityState + "<br>"
    } else {
        selectedTeamInfo += currentTeamInfo.cityStateLocal + "<br>"
    }
    if (originalAndSustaining.indexOf(teamNumber) > 0) {
        selectedTeamInfo += "<br>An Original and Sustaining Team founded in "
    } else {
        selectedTeamInfo += "<br>Founded in "
    }
    selectedTeamInfo += currentTeamInfo.rookieYear + ", this is their " + rookieTag + " competing with FIRST.</span>";
    BootstrapDialog.show({
        type: 'type-success',
        icon: 'glyphicon glyphicon-tower',
        title: '<b>Alliance Team Information</b>',
        message: selectedTeamInfo,
        buttons: [{
            label: 'Congratulations!', hotkey: 13, cssClass: "btn btn-success", action: function (dialogRef) {
                dialogRef.close()
            }
        }]
    })
}
function asyncAPICall(apiEndpoint, year, service, teamOrEvent) {
    return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        var data = {};
        req.open('GET', apiEndpoint + year + '/' + service + '/' + teamOrEvent + "/");
        req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
        req.addEventListener('load', function () {
            if (req.status === 200) {
                data = JSON.parse(req.responseText);
                data.year = year;
                resolve(JSON.stringify(data));
            } else {
                resolve(null);
            }
        });
        req.send();
    });
};

function pagedAsyncAPICall(apiEndpoint, year, service, teamOrEvent, pageNumber) {
    return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        var data = {};
        req.open('GET', apiEndpoint + year + '/' + service + '/' + teamOrEvent + '/' + pageNumber);
        req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
        req.addEventListener('load', function () {
            if (req.status === 200) {
                data = JSON.parse(req.responseText);
                data.year = year;
                resolve(data);
            } else {
                resolve(null);
            }
        });
        req.send();
    });
};

function getTeamAwards(teamNumber, year) {
    "use strict";
    teamAwardCalls++;
    $('#teamDataTabPicker').addClass('alert-danger');
    var awards = "";
    var flatAwards = "";
    var eventNames = [];
    var data = {};
    //eventNames[String(year)] = JSON.parse(localStorage.events);
    //temporary solution
    eventNames["2019"] = events2019;
    
    eventNames["2018"] = events2018;
    eventNames["2017"] = events2017;
    eventNames["2016"] = events2016;
    eventNames["2015"] = events2015;
    var teamData = decompressLocalStorage("teamData" + teamNumber);
    var awardHilight = { "before": "<b>", "after": "</b>" };
    var awardName = "";
    var promisesArray = [];
    if (teamData.rookieYear <= year) {
        promisesArray.push(asyncAPICall(apiURL, year, "awards", teamNumber));
    }
    if (teamData.rookieYear <= Number(year) - 1) {
        promisesArray.push(asyncAPICall(apiURL, (year - 1).toString(), "awards", teamNumber));
    }
    if (teamData.rookieYear <= Number(year) - 2) {
        promisesArray.push(asyncAPICall(apiURL, (year - 2).toString(), "awards", teamNumber));
    }
    teamLoadProgressBar++;
    $('#teamloadprogressbar').attr("style", "width:" + (teamLoadProgressBar / teamCountTotal * 100) + "%");
    $('#teamProgressBarLoading').attr("style", "width:" + (teamLoadProgressBar / teamCountTotal * 100) + "%");
    var handleAllPromises = Promise.all(promisesArray);

    handleAllPromises.then(function (values) {
        for (var j = 0; j < values.length; j++) {
            if (values[j] !== null) {
                data = JSON.parse(values[j]);
                if (data.Awards !== '{"Awards":[]}') {
                    for (var i = 0; i < data.Awards.length; i++) {
                        awardName = data.Awards[i].name;
                        awardHilight = awardsHilight(awardName);
                        awards += '<span class="awardsDepth' + String(j + 1) + '">' + awardHilight.before + data.year + ' <span class="awardsEventName">' + eventNames[data.year][data.Awards[i].eventCode] + '</span><span class="awardsEventCode">' + data.Awards[i].eventCode + '</span>: ' + awardName + awardHilight.after;
                        flatAwards += data.year + " " + eventNames[data.year][data.Awards[i].eventCode] + ": " + awardName + String.fromCharCode(10);
                        if (i === data.Awards.length - 1) {
                            awards += '<span class="lastAward' + String(j + 1) + '"><span class="awardsSeparator1"> || </span><span class="awardsSeparator2"> // </span><span class="awardsSeparator3"><br></span></span></span>';
                        } else {
                            awards += '<span class="awardsSeparator1"> || </span><span class="awardsSeparator2"> // </span><span class="awardsSeparator3"><br></span></span>';
                        }
                    }
                }

            }

        }
        teamData.awards = awards;
        teamData.awardsNoFormatting = flatAwards;
        compressLocalStorage("teamData" + teamNumber, teamData);
        teamAwardCalls--;
        if ((teamAwardCalls === 0) && (teamUpdateCalls === 0) && (lastSchedulePage)) {
            $('#teamDataTabPicker').removeClass('alert-danger');
            $('#teamDataTabPicker').addClass('alert-success');
            $('#teamloadprogress').hide();
            $('#teamProgressBar').hide();
            teamLoadProgressBar = 0;
            $('#teamloadprogressbar').attr("style", "width:" + (teamLoadProgressBar / teamCountTotal * 100) + "%");
            $('#teamProgressBarLoading').attr("style", "width:" + (teamLoadProgressBar / teamCountTotal * 100) + "%")
        }


    });



}

function getTeamData(teamList, year) {
    "use strict";
    var teamDataLoadPromises = [];
    $('#teamDataTabPicker').addClass('alert-danger');
    for (var i = 0; i < teamList.length; i++) {
        teamDataLoadPromises.push(new Promise((resolve, reject) => {
            var req = new XMLHttpRequest();
            req.open('GET', apiURL + year + '/teams?teamNumber=' + teamList[i].teamNumber);
            req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
            req.addEventListener('load', function () {
                //console.log(req.responseText);
                if (req.status === 200) {
                    if (req.responseText.substr(0, 5) !== '"Team') {
                        var data = JSON.parse(req.responseText);
                        if (data.teams.length > 0) {
                            var teamData = data.teams[0];
                            $("#teamsTableBody").append(generateTeamTableRow(teamData));
                            eventTeamList.push(data.teams[0]);
                            resolve()
                        }
                    }
                }
            });
            req.send()
        }))
    }
    Promise.all(teamDataLoadPromises).then((value) => {
        $('#teamDataTabPicker').removeClass('alert-danger');
        $('#teamDataTabPicker').addClass('alert-success')
    })
}

function getDistrictRanks(districtCode, year) {
    "use strict";
    var req = new XMLHttpRequest();
    req.open('GET', apiURL + year + '/district/rankings/' + districtCode);
    req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req.addEventListener('load', function () {
        if (req.status === 200) {
            var data = JSON.parse(req.responseText);
            var team = {};
            for (var i = 0; i < data.districtRanks.length; i++) {
                districtRankings[data.districtRanks[i].teamNumber] = data.districtRanks[i];
            }

            for (var i = 0; i < eventTeamList.length; i++) {
                $("#rankDistrictRank" + eventTeamList[i].teamNumber).html('<span class="sortDistrictRank">' + districtRankings[eventTeamList[i].teamNumber].rank + "</span><br>(" + districtRankings[eventTeamList[i].teamNumber].totalPoints + " pts)")
            }

        }
    });
    req.send()
}

function playoffScoreDetails(matchNumber1, matchNumber2, tournamentLevel) {
    "use strict";
    var Detail = {};
    var req = new XMLHttpRequest();
    req.open('GET', apiURL + localStorage.currentYear + '/scores/' + localStorage.currentEvent + "/" + tournamentLevel + "/" + matchNumber1 + "/" + matchNumber2 + "/");
    req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req.addEventListener('load', function () {
        if (req.status === 200) {
            Detail = JSON.parse(req.responseText).MatchScores;
            for (var i = 0; i < Detail.length; i++) {
                var winner = {};
                winner.winner = "";
                winner.tieWinner = "";
                winner.level = 0;
                winner.red = 0;
                winner.blue = 0;
                winner.redScore = Detail[i].alliances[1].totalPoints;
                winner.blueScore = Detail[i].alliances[0].totalPoints;
                if ((winner.redScore === winner.blueScore) && (winner.redScore !== null)) {
                    winner.winner = "tie";
                    for (var ii = 0; ii < 5; ii++) {
                        winner.level = ii + 1;
                        var criterion = playoffTiebreakers[localStorage.currentYear][ii].split("+");
                        for (var a = 0; a < criterion.length; a++) {
                            winner.red += Number(Detail[i].alliances[1][criterion[a]])
                            winner.blue += Number(Detail[i].alliances[0][criterion[a]])
                        }
                        if (winner.red > winner.blue) {
                            winner.tieWinner = "Red";
                            break;
                        } else if (winner.red < winner.blue) {
                            winner.tieWinner = "Blue";
                            break;
                        }
                    }
                } else if (winner.redScore > winner.blueScore) {
                    winner.winner = "red";
                } else {
                    winner.winner = "blue";
                }
                Detail[i].winner = winner.winner;
                Detail[i].tiebreaker = winner.tieWinner;
                Detail[i].tiebreakerLevel = winner.level;

                playoffResultsDetails[String(Detail[i].matchNumber)] = Detail[i];

            }
        }
    });
    req.send()
}

function scoreDetails(matchNumber, tournamentLevel) {
    "use strict";
    var req = new XMLHttpRequest();
    req.open('GET', apiURL + localStorage.currentYear + '/scores/' + localStorage.currentEvent + "/" + tournamentLevel + "/" + matchNumber + "/" + matchNumber + "/");
    req.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("token"));
    req.addEventListener('load', function () {
        if (req.status === 200) {
            if (req.responseText.substr(0, 5) !== '"Team') {
                var data = JSON.parse(req.responseText).MatchScores[0];
                var redAllianceScores, blueAllianceScores = [];
                var scoreKeys = Object.keys(data.alliances[0]);
                $("#scoreDetailsMatchNumber").html(data.matchNumber);
                $("#scoreDetailsMatchLevel").html(data.matchLevel);
                if (data.alliances[0].alliance === "Red") {
                    redAllianceScores = Object.values(data.alliances[0]);
                    blueAllianceScores = Object.values(data.alliances[1])
                } else {
                    redAllianceScores = Object.values(data.alliances[1]);
                    blueAllianceScores = Object.values(data.alliances[0])
                }
                $("#scoreTableBody").empty();
                for (var i = 0; i < scoreKeys.length; i++) {
                    $("#scoreTableBody").append("<tr><td>" + scoreKeys[i] + " : " + redAllianceScores[i] + "</td><td>" + scoreKeys[i] + " : " + blueAllianceScores[i] + "</td></tr")
                }
                openTab(event, 'scoreDetails')
            }
        }
    });
    req.send()
}

function generateMatchTableRow(matchData) {
    "use strict";
    var returnData = '<tr>';
    var matchWinner = "";
    if (matchData.actualStartTime) {
        returnData += "<td>Actual:<br>" + moment(matchData.actualStartTime, 'YYYY-MM-DDTHH:mm:ss').format('ddd hh:mm A') + '</td>'
    } else {
        if (localStorage.offseason === "true") {
            returnData += "<td>Scheduled:<br>" + matchData.startTime + '</td>'
        } else {
            returnData += "<td>Scheduled:<br>" + moment(matchData.startTime, 'YYYY-MM-DDTHH:mm:ss').format('ddd hh:mm:ss A') + '</td>'
        }
    }
    returnData += "<td>" + matchData.description + '</td>';
    returnData += "<td>" + matchData.matchNumber + '</td>';
    if ((matchData.scoreRedFinal !== null) && (matchData.scoreRedFinal > matchData.scoreBlueFinal)) {
        matchWinner = "Red";
        returnData += '<td onclick="scoreDetails(' + matchData.matchNumber + ',' + "'" + tournamentLevel(matchData.tournamentLevel) + "'" + ')"><span class="redScoreWin">R:' + matchData.scoreRedFinal + '</span><br><span class="blueScore"> B:' + matchData.scoreBlueFinal + '</span></td>'
    } else if ((matchData.scoreRedFinal !== null) && matchData.scoreRedFinal < matchData.scoreBlueFinal) {
        matchWinner = "Blue";
        returnData += '<td onclick="scoreDetails(' + matchData.matchNumber + ',' + "'" + tournamentLevel(matchData.tournamentLevel) + "'" + ')"><span class="redScore">R:' + matchData.scoreRedFinal + '</span><br><span class="blueScoreWin"> B:' + matchData.scoreBlueFinal + '</span></td>'
    } else if (matchData.scoreRedFinal !== null) {
        matchWinner = "Tie";
        returnData += '<td onclick="scoreDetails(' + matchData.matchNumber + ',' + "'" + tournamentLevel(matchData.tournamentLevel) + "'" + ')"><span class="redScore">R:' + matchData.scoreRedFinal + '</span><br><span class="blueScore"> B:' + matchData.scoreBlueFinal + '</span></td>'
    } else {
        matchWinner = "No results yet";
        returnData += '<td>No data.</td>'
    }
    returnData += '<td><span class = "redAllianceTeam">' + getTeamForStation(matchData.teams, 'Red1').teamNumber + '</span><br><span class = "blueAllianceTeam">' + getTeamForStation(matchData.teams, 'Blue1').teamNumber + '</span></td>';
    returnData += '<td><span class = "redAllianceTeam">' + getTeamForStation(matchData.teams, 'Red2').teamNumber + '</span><br><span class = "blueAllianceTeam">' + getTeamForStation(matchData.teams, 'Blue2').teamNumber + '</span></td>';
    returnData += '<td><span class = "redAllianceTeam">' + getTeamForStation(matchData.teams, 'Red3').teamNumber + '</span><br><span class = "blueAllianceTeam">' + getTeamForStation(matchData.teams, 'Blue3').teamNumber + '</span></td>';
    if (matchData.scoreBlueFinal > localStorage.matchHighScore) {
        localStorage.matchHighScore = matchData.scoreBlueFinal;
        localStorage.highScoreDetails = matchData.description + "<br>(" + getTeamForStation(matchData.teams, 'Blue1').teamNumber + ", " + getTeamForStation(matchData.teams, 'Blue2').teamNumber + ", " + getTeamForStation(matchData.teams, 'Blue3').teamNumber + ")"
    }
    if (matchData.scoreRedFinal > localStorage.matchHighScore) {
        localStorage.matchHighScore = matchData.scoreRedFinal;
        localStorage.highScoreDetails = matchData.description + "<br>(" + getTeamForStation(matchData.teams, 'Red1').teamNumber + ", " + getTeamForStation(matchData.teams, 'Red2').teamNumber + ", " + getTeamForStation(matchData.teams, 'Red3').teamNumber + ")"
    }
    if (highScores['"' + getTeamForStation(matchData.teams, 'Blue1').teamNumber + '.score"'] < matchData.scoreBlueFinal) {
        highScores['"' + getTeamForStation(matchData.teams, 'Blue1').teamNumber + '.score"'] = matchData.scoreBlueFinal;
        highScores['"' + getTeamForStation(matchData.teams, 'Blue1').teamNumber + '.description"'] = matchData.description
    }
    if (highScores['"' + getTeamForStation(matchData.teams, 'Blue2').teamNumber + '.score"'] < matchData.scoreBlueFinal) {
        highScores['"' + getTeamForStation(matchData.teams, 'Blue2').teamNumber + '.score"'] = matchData.scoreBlueFinal;
        highScores['"' + getTeamForStation(matchData.teams, 'Blue2').teamNumber + '.description"'] = matchData.description
    }
    if (highScores['"' + getTeamForStation(matchData.teams, 'Blue3').teamNumber + '.score"'] < matchData.scoreBlueFinal) {
        highScores['"' + getTeamForStation(matchData.teams, 'Blue3').teamNumber + '.score"'] = matchData.scoreBlueFinal;
        highScores['"' + getTeamForStation(matchData.teams, 'Blue3').teamNumber + '.description"'] = matchData.description
    }
    if (highScores['"' + getTeamForStation(matchData.teams, 'Red1').teamNumber + '.score"'] < matchData.scoreRedFinal) {
        highScores['"' + getTeamForStation(matchData.teams, 'Red1').teamNumber + '.score"'] = matchData.scoreRedFinal;
        highScores['"' + getTeamForStation(matchData.teams, 'Red1').teamNumber + '.description"'] = matchData.description
    }
    if (highScores['"' + getTeamForStation(matchData.teams, 'Red2').teamNumber + '.score"'] < matchData.scoreRedFinal) {
        highScores['"' + getTeamForStation(matchData.teams, 'Red2').teamNumber + '.score"'] = matchData.scoreRedFinal;
        highScores['"' + getTeamForStation(matchData.teams, 'Red2').teamNumber + '.description"'] = matchData.description
    }
    if (highScores['"' + getTeamForStation(matchData.teams, 'Red3').teamNumber + '.score"'] < matchData.scoreRedFinal) {
        highScores['"' + getTeamForStation(matchData.teams, 'Red3').teamNumber + '.score"'] = matchData.scoreRedFinal;
        highScores['"' + getTeamForStation(matchData.teams, 'Red3').teamNumber + '.description"'] = matchData.description
    }
    playoffResults[matchData.description] = matchWinner;
    playoffResults[String(matchData.matchNumber)] = matchWinner;
    return returnData + '</tr>'
}

function getTeamForStation(teamList, station) {
    "use strict";
    for (var j = 0; j < teamList.length; j++) {
        if (teamList[j].station === station) {
            return teamList[j]
        }
    }
    var r = {};
    r.teamNumber = "";
    return r
}

function updateRanksTableRow(teamData, teamNumber) {
    "use strict";
    var returnData = '<tr class="ranksTableRow"><td class="rankTableNumber" id="rankTableNumber' + teamNumber + '">' + teamNumber + '</td>';
    returnData += '<td id="rankTableRank' + teamNumber + '" class="rankTableRank">' + teamData.rank + '</td>';
    if (teamData.nameShortLocal === "") {
        returnData += '<td id="rankTableName' + teamNumber + '">' + teamData.nameShort + '</td>'
    } else {
        returnData += '<td id="rankTableName' + teamNumber + '">' + teamData.nameShortLocal + '</td>'
    }
    returnData += '<td id="rankTableRP' + teamNumber + '">' + teamData.sortOrder1 + '</td>';
    returnData += '<td id="rankTableWins' + teamNumber + '">' + teamData.wins + '</td>';
    returnData += '<td id="rankTableLosses' + teamNumber + '">' + teamData.losses + '</td>';
    returnData += '<td id="rankTableTies' + teamNumber + '">' + teamData.ties + '</td>';
    returnData += '<td id="rankTableQualAverage' + teamNumber + '">' + teamData.qualAverage + '</td>';
    returnData += '<td id="rankTableDq' + teamNumber + '">' + teamData.dq + '</td>';
    returnData += '<td id="rankTableMatchesPlayed' + teamNumber + '">' + teamData.matchesPlayed + '</td>';
    returnData += '<td id="rankDistrictRank' + teamNumber + '" class="districtRank rankTableDistrictRank"></td>';
    return returnData + '</tr>'
}

function resetVisits() {
    "use strict";
    for (var j = 0; j < eventTeamList.length; j++) {
        var team = decompressLocalStorage("teamData" + eventTeamList[j].teamNumber);
        team.lastVisit = "No recent visit";
        compressLocalStorage("teamData" + eventTeamList[j].teamNumber, team);
        $("#lastVisit" + eventTeamList[j].teamNumber).attr("lastvisit", "No recent visit");
        $("#lastVisit" + eventTeamList[j].teamNumber).html("No recent visit")
    }
}

function updateTeamTableRow(teamData) {
    "use strict";
    var teamInfo = decompressLocalStorage("teamData" + teamData.teamNumber);
    var lastVisit = "";
    var avatar = "";
    if (teamInfo.lastVisit === "No recent visit") {
        lastVisit = "No recent visit"
    } else {
        lastVisit = moment(teamInfo.lastVisit).fromNow()
    }
    var returnData = '<tr class="teamsTableRow"><td class = "btn-default" id="teamTableNumber' + teamData.teamNumber + '" onclick="updateTeamInfo(' + teamData.teamNumber + ')"><span class="teamDataNumber">' + teamData.teamNumber + '</span><br><span id="lastVisit' + teamData.teamNumber + '" teamNumber = "' + teamData.teamNumber + '"  lastvisit = "' + teamInfo.lastVisit + '">' + lastVisit + '</span></td>';
    returnData += '<td id="teamTableRank' + teamData.teamNumber + '" class="rank0"></td>';
    if ((teamInfo.avatar !== "null") && (Number(localStorage.currentYear) >= 2018 && (typeof teamInfo !== "undefined"))) {
        avatar = '<img src="https://www.gatool.org/' + teamInfo.avatar + '">&nbsp;'
    }
    if (teamInfo.nameShortLocal === "") {
        returnData += '<td id="teamTableName' + teamData.teamNumber + '">' + '<span id="avatar' + teamData.teamNumber + '">' + avatar + '</span><span class="teamTableName">' + teamInfo.nameShort + '</span></td>'
    } else {
        returnData += '<td  class="bg-success" id="teamTableName' + teamData.teamNumber + '">' + '<span id="avatar' + teamData.teamNumber + '">' + avatar + '</span><span class="teamTableName">' + teamInfo.nameShortLocal + '</span></td>'
    }
    if (teamInfo.cityStateLocal === "") {
        returnData += '<td id="teamTableCityState' + teamData.teamNumber + '">' + teamInfo.cityState + '<span class="cityStateSort">' + teamInfo.cityStateSort + '</span></td>'
    } else {
        returnData += '<td  class="bg-success" id="teamTableCityState' + teamData.teamNumber + '">' + teamInfo.cityStateLocal + '<span class="cityStateSort">' + teamInfo.cityStateSort + '</span></td>'
    }
    if (teamInfo.topSponsorsLocal === "") {
        returnData += '<td id="teamTableNameFull' + teamData.teamNumber + '">' + teamInfo.topSponsors + '</td>'
    } else {
        returnData += '<td  class="bg-success" id="teamTableNameFull' + teamData.teamNumber + '">' + teamInfo.topSponsorsLocal + '</td>'
    }
    if (teamInfo.organizationLocal === "") {
        returnData += '<td id="teamTableOrganization' + teamData.teamNumber + '">' + teamInfo.organization + '</td>'
    } else {
        returnData += '<td class="bg-success" id="teamTableNameOrganization' + teamData.teamNumber + '">' + teamInfo.organizationLocal + '</td>'
    }
    if (Number(teamInfo.teamYearsNoCompeteLocal) > 0) {
        returnData += '<td class="bg-success"  id="teamTableRookieYear' + teamData.teamNumber + '">' + rookieYearDisplay(teamData.rookieYear, teamInfo.teamYearsNoCompeteLocal) + '</td>';
    }
    else {
        returnData += '<td id="teamTableRookieYear' + teamData.teamNumber + '">' + rookieYearDisplay(teamData.rookieYear, teamInfo.teamYearsNoCompeteLocal) + '</td>';
    }
    if ((teamInfo.robotName === null) && (teamInfo.robotNameLocal === "")) {
        returnData += '<td id="teamTableRobotName' + teamData.teamNumber + '">' + "No robot name reported" + '</td>'
    } else {
        if (teamInfo.robotNameLocal === "") {
            returnData += '<td id="teamTableRobotName' + teamData.teamNumber + '">' + teamInfo.robotName + '</td>'
        } else {
            returnData += '<td  class="bg-success" id="teamTableRobotName' + teamData.teamNumber + '">' + teamInfo.robotNameLocal + '</td>'
        }
    }
    returnData += '<td class = "cityStateSort">' + teamInfo.cityStateSort + '</td>';
    return returnData + '</tr>'
}

function generateTeamTableRow(teamData) {
    "use strict";
    var teamInfo = {};
    var avatar = "";
    if (typeof (localStorage["teamData" + teamData.teamNumber]) !== 'undefined') {
        teamInfo = decompressLocalStorage("teamData" + teamData.teamNumber);
        if (typeof teamInfo.cityStateSort === "undefined") {
            teamInfo.cityStateSort = teamData.country + ":" + teamData.stateProv + ":" + teamData.city
        }
        if (typeof teamInfo.teamYearsNoCompeteLocal === "undefined") {
            teamInfo.teamYearsNoCompeteLocal = ""
        }
        if (typeof teamInfo.showRobotName === "undefined") {
            teamInfo.showRobotName = true
        }
    } else {
        teamInfo = {
            "nameShort": teamData.nameShort,
            "cityState": teamData.city + ', ' + teamData.stateProv,
            "cityStateSort": teamData.country + ":" + teamData.stateProv + ":" + teamData.city,
            "nameFull": teamData.nameFull,
            "rookieYear": teamData.rookieYear,
            "robotName": teamData.robotName,
            "organization": "",
            "sponsors": "",
            "topSponsors": "",
            "awards": "",
            "alliance": "",
            "allianceName": "",
            "allianceChoice": "",
            "rank": "",
            "sortOrder1": "",
            "sortOrder2": "",
            "sortOrder3": "",
            "sortOrder4": "",
            "sortOrder5": "",
            "sortOrder6": "",
            "wins": "",
            "losses": "",
            "ties": "",
            "qualAverage": "",
            "dq": "",
            "matchesPlayed": "",
            "nameShortLocal": "",
            "cityStateLocal": "",
            "topSponsorsLocal": "",
            "sponsorsLocal": "",
            "organizationLocal": "",
            "robotNameLocal": "",
            "awardsLocal": "",
            "teamMottoLocal": "",
            "teamNotesLocal": "",
            "avatar": "null",
            "lastVisit": "No recent visit",
            "teamYearsNoCompeteLocal": ""
        }
    }
    var returnData = "";
    var robotName = "";
    var organization = "";
    var sponsors = "";
    var topSponsors = "";
    var topSponsorsArray = [];
    var sponsorsRaw = teamData.nameFull;
    var sponsorArray = [];
    var organizationArray = [];
    if (teamData.schoolName) {
        organization = teamData.schoolName
    }
    if (!organization) {
        sponsorArray = trimArray(teamData.nameFull.split("/"))
    } else {
        if (organization === sponsorsRaw) {
            sponsorArray[0] = sponsorsRaw
        } else {
            sponsorsRaw = sponsorsRaw.slice(0, sponsorsRaw.length - organization.length).trim();
            sponsorsRaw = sponsorsRaw.slice(0, sponsorsRaw.length - 1).trim();
            sponsorArray = trimArray(sponsorsRaw.split("/"))
        }
    }
    organizationArray = trimArray(teamData.nameFull.split("/").pop().split("&"));
    if (!sponsorArray && !organizationArray && !organization) {
        organization = "No organization in TIMS";
        sponsors = "No sponsors in TIMS";
        topSponsorsArray[0] = sponsors
    }
    if (sponsorArray.length === 1) {
        sponsors = sponsorArray[0];
        topSponsors = sponsors
    } else {
        if (organizationArray.length > 1 && !organization) {
            sponsorArray.pop();
            sponsorArray.push(organizationArray.slice(0).shift())
        }
        topSponsorsArray = sponsorArray.slice(0, 5);
        var lastSponsor = sponsorArray.pop();
        sponsors = sponsorArray.join(", ");
        sponsors += " & " + lastSponsor;
        lastSponsor = topSponsorsArray.pop();
        topSponsors = topSponsorsArray.join(", ");
        topSponsors += " & " + lastSponsor
    }
    if (organizationArray.length === 1 && !organization) {
        organization = organizationArray[0]
    } else {
        if (!organization) {
            organizationArray.shift();
            organization = organizationArray.join(" & ")
        }
    }
    var lastVisit = "";
    if (teamInfo.lastVisit === "No recent visit") {
        lastVisit = "No recent visit"
    } else {
        lastVisit = moment(teamInfo.lastVisit).fromNow()
    }
    returnData += '<tr class="teamsTableRow"><td class = "btn-default" id="teamTableNumber' + teamData.teamNumber + '" onclick="updateTeamInfo(' + teamData.teamNumber + ')"><span class="teamDataNumber">' + teamData.teamNumber + '</span><br><span id="lastVisit' + teamData.teamNumber + '" teamNumber = "' + teamData.teamNumber + '" lastvisit = "' + teamInfo.lastVisit + '">' + lastVisit + '</span></td>';
    returnData += '<td id="teamTableRank' + teamData.teamNumber + '" class="rank0"></td>';
    if ((teamInfo.avatar !== "null") && (Number(localStorage.currentYear) >= 2018)) {
        avatar = '<img src="https://www.gatool.org/' + teamInfo.avatar + '">&nbsp;'
    }
    if (teamInfo.nameShortLocal === "") {
        returnData += '<td id="teamTableName' + teamData.teamNumber + '">' + '<span id="avatar' + teamData.teamNumber + '">' + avatar + '</span><span class="teamTableName">' + teamInfo.nameShort + '</span></td>'
    } else {
        returnData += '<td  class="bg-success" id="teamTableName' + teamData.teamNumber + '">' + '<span id="avatar' + teamData.teamNumber + '">' + avatar + '</span><span class="teamTableName">' + teamInfo.nameShortLocal + '</span></td>'
    }
    if (teamInfo.cityStateLocal === "") {
        returnData += '<td id="teamTableCityState' + teamData.teamNumber + '">' + teamData.city + ", " + teamData.stateProv + '<span class="cityStateSort">' + teamInfo.cityStateSort + '</span></td>'
    } else {
        returnData += '<td  class="bg-success" id="teamTableCityState' + teamData.teamNumber + '">' + teamInfo.cityStateLocal + '<span class="cityStateSort">' + teamInfo.cityStateSort + '</span></td>'
    }
    if (teamInfo.topSponsorsLocal === "") {
        returnData += '<td id="teamTableNameFull' + teamData.teamNumber + '">' + topSponsors + '</td>'
    } else {
        returnData += '<td  class="bg-success" id="teamTableNameFull' + teamData.teamNumber + '">' + teamInfo.topSponsorsLocal + '</td>'
    }
    if (teamInfo.organizationLocal === "") {
        returnData += '<td id="teamTableOrganization' + teamData.teamNumber + '">' + organization + '</td>'
    } else {
        returnData += '<td  class="bg-success" id="teamTableNameOrganization' + teamData.teamNumber + '">' + teamInfo.organizationLocal + '</td>'
    }
    if (Number(teamInfo.teamYearsNoCompeteLocal) > 0) {
        returnData += '<td class="bg-success"  id="teamTableRookieYear' + teamData.teamNumber + '">' + rookieYearDisplay(teamData.rookieYear, teamInfo.teamYearsNoCompeteLocal) + '</td>';
    }
    else {
        returnData += '<td id="teamTableRookieYear' + teamData.teamNumber + '">' + rookieYearDisplay(teamData.rookieYear, teamInfo.teamYearsNoCompeteLocal) + '</td>';
    }
    if ((teamData.robotName === null) && (teamInfo.robotNameLocal === "")) {
        returnData += '<td id="teamTableRobotName' + teamData.teamNumber + '">' + "No robot name reported" + '</td>'
    } else {
        if (teamInfo.robotNameLocal === "") {
            returnData += '<td id="teamTableRobotName' + teamData.teamNumber + '">' + teamData.robotName + '</td>'
        } else {
            returnData += '<td  class="bg-success" id="teamTableRobotName' + teamData.teamNumber + '">' + teamInfo.robotNameLocal + '</td>'
        }
        robotName = teamData.robotName
    }
    returnData += '<td class = "cityStateSort">' + teamInfo.cityStateSort + '</td>';
    teamInfo.sponsors = sponsors;
    teamInfo.topSponsors = topSponsors;
    teamInfo.organization = organization;
    compressLocalStorage("teamData" + teamData.teamNumber, teamInfo);
    return returnData + '</tr>'
}

function teamTableRankHighlight(rank) {
    "use strict";
    if ((rank <= 8) && (rank > 1)) {
        return "rank2"
    } else if ((rank < 11) && (rank > 8)) {
        return "rank9"
    } else if (rank === 1) {
        return "rank1"
    } else {
        return "rank0"
    }
}

function rankHighlight(station, rank) {
    "use strict";
    if ((rank <= 8) && (rank > 1)) {
        document.getElementById(station).style.color = "white";
        document.getElementById(station).style.backgroundColor = "green"
    } else if ((rank < 11) && (rank > 8)) {
        document.getElementById(station).style.color = "black";
        document.getElementById(station).style.backgroundColor = "yellow"
    } else if (rank === 1) {
        document.getElementById(station).style.color = "white";
        document.getElementById(station).style.backgroundColor = "orange"
    } else {
        document.getElementById(station).style.color = "";
        document.getElementById(station).style.backgroundColor = ""
    }
}

function updateTeamInfo(teamNumber) {
    "use strict";
    localStorage.currentTeam = teamNumber;
    var teamData = decompressLocalStorage("teamData" + teamNumber);
    $("#teamNumberUpdate").html(teamNumber);
    if (teamData.nameShort) {
        $("#teamNameUpdateTIMS").html(teamData.nameShort)
    } else {
        $("#teamNameUpdateTIMS").html("No value")
    }
    if (teamData.nameShortLocal === "") {
        $("#teamNameUpdate").val(teamData.nameShort);
        $("#teamNameUpdateLabel").removeClass("bg-success")
    } else {
        $("#teamNameUpdate").val(teamData.nameShortLocal);
        $("#teamNameUpdateLabel").addClass("bg-success")
    }
    if (teamData.organization) {
        $("#organizationUpdateTIMS").html(teamData.organization)
    } else {
        $("#organizationUpdateTIMS").html("No value")
    }
    if (teamData.organizationLocal === "") {
        $("#organizationUpdate").val(teamData.organization);
        $("#organizationUpdateLabel").removeClass("bg-success")
    } else {
        $("#organizationUpdate").val(teamData.organizationLocal);
        $("#organizationUpdateLabel").addClass("bg-success")
    }
    if (teamData.robotName) {
        $("#robotNameUpdateTIMS").html(teamData.robotName)
    } else {
        $("#robotNameUpdateTIMS").html("No value")
    }
    if (teamData.robotNameLocal === "") {
        $("#robotNameUpdate").val(teamData.robotName);
        $("#robotNameUpdateLabel").removeClass("bg-success")
    } else {
        $("#robotNameUpdate").val(teamData.robotNameLocal);
        $("#robotNameUpdateLabel").addClass("bg-success")
    }
    if ((typeof teamData.showRobotName) !== "boolean") {
        teamData.showRobotName = true;
    }
    if (teamData.showRobotName === true) {
        $("#showRobotName").bootstrapSwitch('state', true)
    } else {
        $("#showRobotName").bootstrapSwitch('state', false);
    }
    if (teamData.cityState) {
        $("#cityStateUpdateTIMS").html(teamData.cityState)
    } else {
        $("#cityStateUpdateTIMS").html("No value")
    }
    if (teamData.cityStateLocal === "") {
        $("#cityStateUpdate").val(teamData.cityState);
        $("#cityStateUpdateLabel").removeClass("bg-success")
    } else {
        $("#cityStateUpdate").val(teamData.cityStateLocal);
        $("#cityStateUpdateLabel").addClass("bg-success")
    }
    if (teamData.topSponsorsLocal === "") {
        $("#topSponsorsUpdate").val(teamData.topSponsors);
        $("#topSponsorsUpdateLabel").removeClass("bg-success")
    } else {
        $("#topSponsorsUpdate").val(teamData.topSponsorsLocal);
        $("#topSponsorsUpdateLabel").addClass("bg-success")
    }
    if (teamData.sponsorsLocal === "") {
        $("#sponsorsUpdate").val(teamData.sponsors);
        $("#sponsorsUpdateLabel").removeClass("bg-success")
    } else {
        $("#sponsorsUpdate").val(teamData.sponsorsLocal);
        $("#sponsorsUpdateLabel").addClass("bg-success")
    }
    if (teamData.awardsLocal === "") {
        $("#awardsUpdate").html(teamData.awards);
        $("#awardsUpdateLabel").removeClass("bg-success")
    } else {
        $("#awardsUpdate").html(teamData.awardsLocal);
        $("#awardsUpdateLabel").addClass("bg-success")
    }
    if (teamData.teamYearsNoCompeteLocal) {
        $("#teamYearsNoCompeteUpdate").val(teamData.teamYearsNoCompeteLocal);
        $("#teamYearsNoCompeteUpdateLabel").addClass("bg-success");
    } else {
        $("#teamYearsNoCompeteUpdate").val("")
        $("#teamYearsNoCompeteUpdateLabel").removeClass("bg-success");
    }
    if (teamData.teamMottoLocal) {
        $("#teamMottoUpdate").val(teamData.teamMottoLocal);
        $("#teamMottoUpdateLabel").addClass("bg-success");
    } else {
        $("#teamMottoUpdate").val("");
        $("#teamMottoUpdateLabel").removeClass("bg-success");
    }
    if (teamData.teamNotesLocal) {
        $("#teamNotesUpdate").val(teamData.teamNotesLocal);
        $("#teamNotesUpdateLabel").addClass("bg-success");
    } else {
        $("#teamNotesUpdate").val("");
        $("#teamNotesUpdateLabel").removeClass("bg-success");
    }

    $(".tabcontent").hide();
    $("#teamDataEntry").show()
}

function updateTeamInfoDone(cloudSave) {
    "use strict";
    var teamNumber = localStorage.currentTeam;
    var teamData = decompressLocalStorage("teamData" + teamNumber);
    if ((teamData.nameShort !== $("#teamNameUpdate").val()) && ($("#teamNameUpdate").val() !== "")) {
        teamData.nameShortLocal = $("#teamNameUpdate").val();
        $("#teamTableName" + teamNumber).html($("#teamNameUpdate").val())
    } else {
        teamData.nameShortLocal = "";
        $("#teamTableName" + teamNumber).html(teamData.nameShort)
    }
    if ((teamData.cityState !== $("#cityStateUpdate").val()) && ($("#cityStateUpdate").val() !== "")) {
        teamData.cityStateLocal = $("#cityStateUpdate").val();
        $("#teamTableCityState" + teamNumber).html($("#cityStateUpdate").val())
    } else {
        teamData.cityStateLocal = "";
        $("#teamTableCityState" + teamNumber).html(teamData.cityState)
    }
    if (teamData.teamNotesLocal !== $("#teamNotesUpdate").val()) {
        teamData.teamNotesLocal = $("#teamNotesUpdate").val()
    }
    if ((teamData.topSponsors !== $("#topSponsorsUpdate").val()) && ($("#topSponsorsUpdate").val() !== "")) {
        teamData.topSponsorsLocal = $("#topSponsorsUpdate").val();
        $("#teamTableTopSponsors" + teamNumber).html($("#topSponsorsUpdate").val())
    } else {
        teamData.topSponsorsLocal = "";
        $("#teamTableTopSponsors" + teamNumber).html(teamData.topSponsors)
    }
    if ((teamData.sponsors !== $("#sponsorsUpdate").val()) && ($("#sponsorsUpdate").val() !== "")) {
        teamData.sponsorsLocal = $("#sponsorsUpdate").val();
        $("#teamTableSponsors" + teamNumber).html($("#sponsorsUpdate").val())
    } else {
        teamData.sponsorsLocal = "";
        $("#teamTableSponsors" + teamNumber).html(teamData.sponsors)
    }
    if ((teamData.organization !== $("#organizationUpdate").val()) && ($("#organizationUpdate").val() !== "")) {
        teamData.organizationLocal = $("#organizationUpdate").val();
        $("#teamTableOrganization" + teamNumber).html($("#organizationUpdate").val())
    } else {
        teamData.organizationLocal = "";
        $("#teamTableOrganization" + teamNumber).html(teamData.organization)
    }
    if ((teamData.robotName !== $("#robotNameUpdate").val()) && ($("#robotNameUpdate").val() !== "")) {
        teamData.robotNameLocal = $("#robotNameUpdate").val();
        $("#teamTableRobotName" + teamNumber).html($("#robotNameUpdate").val())
    } else {
        teamData.robotNameLocal = "";
        $("#teamTableRobotName" + teamNumber).html(teamData.robotName)
    }
    if ($("#awardsUpdate").html() === "<br>") {
        $("#awardsUpdate").html("")
    }
    if ((teamData.awards !== $("#awardsUpdate").html()) && ($("#awardsUpdate").html() !== "")) {
        teamData.awardsLocal = $("#awardsUpdate").html();
        $("#teamTableAwards" + teamNumber).html($("#awardsUpdate").html())
    } else {
        teamData.awardsLocal = "";
        $("#teamTableAwards" + teamNumber).html(teamData.awards)
    }
    if (teamData.teamMottoLocal !== $("#teamMottoUpdate").val()) {
        teamData.teamMottoLocal = $("#teamMottoUpdate").val()
    }
    if (teamData.teamYearsNoCompeteLocal !== $("#teamYearsNoCompeteUpdate").val()) {
        teamData.teamYearsNoCompeteLocal = $("#teamYearsNoCompeteUpdate").val()
    }
    teamData.showRobotName = $("#showRobotName").bootstrapSwitch('state');
    teamData.lastVisit = moment().format();
    compressLocalStorage("teamData" + teamNumber, teamData);
    //console.log(typeof cloudSave + " cloudSave value " + cloudSave);
    if (cloudSave === "true") {
        teamUpdateCalls++;
        sendTeamUpdates(teamNumber, !0)
    }
    $(".tabcontent").hide();
    updateTeamTable();
    $("#teamdata").show();
    document.getElementById('teamDataTabPicker').click()
}

function rookieYearDisplay(year, offset) {
    "use strict";
    var currrentYear = localStorage.currentYear;
    if (typeof offset === "undefined") {
        offset = 0;
    } else {
        offset = Number(offset);
    }
    var years = currrentYear - year + 1 - offset;
    var yearTest = years.toString().slice(-1);
    var tag = "";
    switch (years) {
        case 1:
            return year + " (Rookie Year)";
        case 2:
            return year + " (2nd season)";
        case 3:
            return year + " (3rd season)";
        case 10:
            return year + " (10th season)";
        case 11:
            return year + " (11th season)";
        case 12:
            return year + " (12th season)";
        case 13:
            return year + " (13th season)";
        default:
            if (yearTest === "1") {
                tag = "st"
            } else if (yearTest === "2") {
                tag = "nd"
            } else if (yearTest === "3") {
                tag = "rd"
            } else {
                tag = "th"
            }
            return year + " (" + parseInt(currrentYear - year + 1 - offset) + tag + " season)"
    }
}

function resetAwards() {
    "use strict";
    BootstrapDialog.show({
        type: 'type-warning',
        title: '<b>Reset the locally stored Team Awards</b>',
        message: 'You are about to reset your team awards updates for <b>' + localStorage.eventName + '</b> in your local gatool. <b>This will replace your local changes for this event</b> with the data from TIMS. The freshly loaded awards data will be formatted according to your settings on the Setup Screen.<br><b>Are you sure you want to do this?</b>',
        buttons: [{
            icon: 'glyphicon glyphicon-check',
            label: "No, I don't want to reset now.",
            hotkey: 78,
            cssClass: "btn btn-info col-md-5 col-xs-12 col-sm-12 alertButton",
            action: function (dialogRef) {
                dialogRef.close()
            }
        }, {
            icon: 'glyphicon glyphicon-cloud-download',
            label: 'Yes, I do want to reset now.',
            hotkey: 13,
            cssClass: 'btn btn-success col-md-5 col-xs-12 col-sm-12 alertButton',
            action: function (dialogRef) {
                dialogRef.close();
                BootstrapDialog.show({
                    type: 'type-warning',
                    title: '<b>Reset the locally stored Team Awards</b>',
                    message: "Are you sure you want to reset your team awards updates for <b>" + localStorage.eventName + "</b> in your local gatool? <b>This will replace your local changes for this event</b> with the data from TIMS.",
                    buttons: [{
                        icon: 'glyphicon glyphicon-check',
                        label: "No, I don't want to reset now.",
                        hotkey: 78,
                        cssClass: "btn btn-info col-md-5 col-xs-12 col-sm-12 alertButton",
                        action: function (dialogRef) {
                            dialogRef.close()
                        }
                    }, {
                        icon: 'glyphicon glyphicon-cloud-download',
                        cssClass: "btn btn-success col-md-5 col-xs-12 col-sm-12 alertButton",
                        label: 'OK',
                        hotkey: 13,
                        title: 'OK',
                        action: function (dialogRef) {
                            dialogRef.close();
                            var teamData = eventTeamList.slice(0);
                            for (var i = 0; i < teamData.length; i++) {
                                var team = decompressLocalStorage("teamData" + teamData[i].teamNumber);
                                team.awardsLocal = "";
                                compressLocalStorage("teamData" + teamData[i].teamNumber, team)
                            }
                            updateTeamTable()
                        }
                    }]
                })
            }
        }]
    })
}

function parsePlayoffMatchName(matchName) {
    "use strict";
    var matchArray = matchName.split(" ");
    if ((matchArray[0] === "Quarterfinal") && (matchArray[1] <= 4)) {
        return "Quarterfinal " + matchArray[1] + " Match 1"
    }
    if ((matchArray[0] === "Quarterfinal") && (matchArray[1] > 4)) {
        if (playoffResults["Quarterfinal " + (matchArray[1] - 4)] === "Red") {
            return "Quarterfinal " + (matchArray[1] - 4) + " Match 2 <br><span class='redScoreWin'>Advantage " + playoffResults["Quarterfinal " + (matchArray[1] - 4)] + "</span>"
        } else if (playoffResults["Quarterfinal " + (matchArray[1] - 4)] === "Blue") {
            return "Quarterfinal " + (matchArray[1] - 4) + " Match 2 <br><span class='blueScoreWin'>Advantage " + playoffResults["Quarterfinal " + (matchArray[1] - 4)] + "</span>"
        } else if (playoffResults["Quarterfinal " + (matchArray[1] - 4)] === "No results yet") {
            return "Quarterfinal " + (matchArray[1] - 4) + " Match 2 <br>First match not reported yet"
        } else {
            var tiebreaker = {};
            tiebreaker.advantage = "No advantage<br>";
            tiebreaker.tiebreaker = playoffResultsDetails[String(currentMatchData.matchNumber - 4)].tiebreaker;
            tiebreaker.tiebreakerLevel = playoffResultsDetails[String(currentMatchData.matchNumber - 4)].tiebreakerLevel;
            if (tiebreaker.tiebreaker === "Red") {
                tiebreaker.advantage = "<span class='redScoreWin'>Advantage Red (L" + tiebreaker.tiebreakerLevel + ")</span><br>";
            } else if (tiebreaker.tiebreaker === "Blue") {
                tiebreaker.advantage = "<span class='blueScoreWin'>Advantage Blue (L" + tiebreaker.tiebreakerLevel + ")</span><br>";
            }
            return "Quarterfinal " + (matchArray[1] - 4) + " Match 2 <br>" + tiebreaker.advantage + "First match tied";
        }
    }
    if ((matchArray[0] === "Semifinal") && (matchArray[1] <= 2)) {
        return "Semifinal " + matchArray[1] + " Match 1"
    }
    if ((matchArray[0] === "Semifinal") && (matchArray[1] > 2)) {
        if (playoffResults["Semifinal " + (matchArray[1] - 2)] === "Red") {
            return "Semifinal " + (matchArray[1] - 2) + " Match 2<br><span class='redScoreWin'>Advantage " + playoffResults["Semifinal " + (matchArray[1] - 2)] + "</span>"
        } else if (playoffResults["Semifinal " + (matchArray[1] - 2)] === "Blue") {
            return "Semifinal " + (matchArray[1] - 2) + " Match 2<br><span class='blueScoreWin'>Advantage " + playoffResults["Semifinal " + (matchArray[1] - 2)] + "</span>"
        } else if (playoffResults["Semifinal " + (matchArray[1] - 2)] === "No results yet") {
            return "Semifinal " + (matchArray[1] - 2) + " Match 2<br>First match not reported yet"
        } else {
            var tiebreaker = {};
            tiebreaker.advantage = "No advantage<br>";
            tiebreaker.tiebreaker = playoffResultsDetails[String(currentMatchData.matchNumber - 2)].tiebreaker;
            tiebreaker.tiebreakerLevel = playoffResultsDetails[String(currentMatchData.matchNumber - 2)].tiebreakerLevel;
            if (tiebreaker.tiebreaker === "Red") {
                tiebreaker.advantage = "<span class='redScoreWin'>Advantage Red (L" + tiebreaker.tiebreakerLevel + ")</span><br>";
            } else if (tiebreaker.tiebreaker === "Blue") {
                tiebreaker.advantage = "<span class='blueScoreWin'>Advantage Blue (L" + tiebreaker.tiebreakerLevel + ")</span><br>";
            }
            return "Semifinal " + (matchArray[1] - 2) + " Match 2 <br>" + tiebreaker.advantage + "First match tied";
        }
    }
    if (matchArray[0] === "Tiebreaker") {
        return matchArray[0] + " " + (matchArray[1] || "")
    }
    if (matchArray[0] === "Final") {
        if (matchArray[1] === "2") {
            if (playoffResults["Final 1"] === "Red") {
                return matchArray[0] + " " + (matchArray[1] || "") + "<br><span class='redScoreWin'>Advantage Red</span>"
            } else if (playoffResults["Final 1"] === "Blue") {
                return matchArray[0] + " " + (matchArray[1] || "") + "<br><span class='blueScoreWin'>Advantage Blue</span>"
            } else if (playoffResults["Final 1"] === "No results yet") {
                return matchArray[0] + " " + (matchArray[1] || "") + "<br>First match not reported yet"
            } else {
                return matchArray[0] + " " + (matchArray[1] || "") + "<br>First match tied"
            }
        }
        return matchArray[0] + " " + (matchArray[1] || "")
    }
}

function davidPriceFormat(priceMatchData) {
    "use strict";
    var matchArray = priceMatchData.description.split(" ");
    var matchNumber = priceMatchData.matchNumber;
    if ((matchArray[0] === "Qualification")) {
        return matchArray[1]
    }
    if ((matchArray[0] === "Quarterfinal") && (matchArray[1] <= 4)) {
        return "Q" + matchArray[1] + "M1"
    }
    $("#davidPriceNumber").removeClass("redScore blueScore tieScore");
    if (inChamps() || inMiChamps()) {
    } else {
    }
    if ((matchNumber > 4) && (matchNumber <= 8)) {
        if (playoffResults[String(matchNumber - 4)] === "Red") {
            $("#davidPriceNumber").addClass("redScore");
            return "Q" + (matchArray[1] - 4) + "M2"
        } else if (playoffResults[String(matchNumber - 4)] === "Blue") {
            $("#davidPriceNumber").addClass("blueScore");
            return "Q" + (matchArray[1] - 4) + "M2"
        } else if (playoffResults[String(matchNumber - 4)] === "No results yet") {
            return "Q" + (matchArray[1] - 4) + "M2"
        } else {
            $("#davidPriceNumber").addClass("tieScore");
            return "Q" + (matchArray[1] - 4) + " M2 M1 Tie"
        }
    }
    if ((matchNumber > 8) && (matchNumber <= 12)) {
        if (playoffResults[String(matchNumber - 8)] === "Tie") {
            if (playoffResults[String(matchNumber - 4)] === "Red") {
                $("#davidPriceNumber").addClass("redScore");
            } else if (playoffResults[String(matchNumber - 4)] === "Blue") {
                $("#davidPriceNumber").addClass("blueScore");
            } else if (playoffResults[String(matchNumber - 4)] === "Tie") {
                $("#davidPriceNumber").addClass("tieScore");
            }
        }
        if (playoffResults[String(matchNumber - 4)] === "Tie") {
            if (playoffResults[String(matchNumber - 8)] === "Red") {
                $("#davidPriceNumber").addClass("redScore");
            } else if (playoffResults[String(matchNumber - 8)] === "Blue") {
                $("#davidPriceNumber").addClass("blueScore");
            }
        }
        return "TB" + (matchArray[1] || "");
    }

    if ((matchNumber > 12) && (matchNumber <= 14)) {
        return "S" + matchArray[1] + "M1"
    }

    if (((matchNumber > 14) && (matchNumber <= 16))) {
        if (playoffResults[String(matchNumber - 2)] === "Red") {
            $("#davidPriceNumber").addClass("redScore");
            return "S" + (matchArray[1] - 2) + "M2"
        } else if (playoffResults[String(matchNumber - 2)] === "Blue") {
            $("#davidPriceNumber").addClass("blueScore");
            return "S" + (matchArray[1] - 2) + "M2"
        } else if (playoffResults[String(matchNumber - 2)] === "No results yet") {
            return "S" + (matchArray[1] - 2) + "M2"
        } else {
            return "S" + (matchArray[1] - 2) + "M2 M1 Tie"
        }
    }

    if ((matchNumber > 16) && (matchNumber <= 18)) {
        if (playoffResults[String(matchNumber - 4)] === "Tie") {
            if (playoffResults[String(matchNumber - 2)] === "Red") {
                $("#davidPriceNumber").addClass("redScore");
            } else if (playoffResults[String(matchNumber - 2)] === "Blue") {
                $("#davidPriceNumber").addClass("blueScore");
            } else if (playoffResults[String(matchNumber - 2)] === "Tie") {
                $("#davidPriceNumber").addClass("tieScore");
            }
        }
        if (playoffResults[String(matchNumber - 2)] === "Tie") {
            if (playoffResults[String(matchNumber - 4)] === "Red") {
                $("#davidPriceNumber").addClass("redScore");
            } else if (playoffResults[String(matchNumber - 4)] === "Blue") {
                $("#davidPriceNumber").addClass("blueScore");
            }
        }
        return "TB" + (matchArray[1] || "");
    }

    if (matchNumber > 18) {
        if (matchNumber > 19) {
            if (playoffResults["Final 1"] === "Red") {
                $("#davidPriceNumber").addClass("redScore");
                return "F" + (matchArray[1] || "")
            } else if (playoffResults["Final 1"] === "Blue") {
                $("#davidPriceNumber").addClass("blueScore");
                return "F" + (matchArray[1] || "")
            } else if (playoffResults["Final 1"] === "No results yet") {
                return "F" + (matchArray[1] || "")
            } else {
                return "F" + (matchArray[1] || "") + "M1 Tie"
            }
        }
        return "F" + (matchArray[1] || "")
    }
    if (matchArray[0] === "Einstein") {
        return "E" + (matchArray[1] || "")
    }
}

function awardsHilight(awardName) {
    "use strict";
    if (awardName === "District Chairman's Award" || awardName === "District Event Winner" || awardName === "District Event Finalist" || awardName === "Regional Engineering Inspiration Award" || awardName === "District Engineering Inspiration Award" || awardName === "District Championship Finalist" || awardName === "District Championship Winner" || awardName === "Regional Winners" || awardName === "Regional Finalists" || awardName === "Regional Chairman's Award" || awardName === "FIRST Dean's List Finalist Award" || awardName === "Championship Subdivision Winner" || awardName === "Championship Subdivision Finalist" || awardName === "Championship Winner" || awardName === "Championship Finalist" || awardName === "Chairman's Award" || awardName === "FIRST Dean's List Award" || awardName === "Woodie Flowers Award") {
        return { "before": "<span class ='awardHilight'>", "after": "</span>" }
    } else {
        return { "before": "<span>", "after": "</span>" }
    }
}

function handleQualsFiles(e) {
    "use strict";
    var rABS = !0;
    var files = e.target.files;
    var i, f;
    for (i = 0; i !== files.length; ++i) {
        f = files[i];
        var reader = new FileReader();
        reader.onload = function (e) {
            var data = e.target.result;
            var workbook;
            if (rABS) {
                workbook = XLSX.read(data, { type: 'binary' })
            } else {
                var arr = fixdata(data);
                workbook = XLSX.read(btoa(arr), { type: 'base64' })
            }
            var worksheet = workbook.Sheets[workbook.SheetNames[0]];
            var worksheet1 = workbook.Sheets[workbook.SheetNames[0]];
            var schedule = XLSX.utils.sheet_to_json(worksheet, { range: 4 });
            var formattedSchedule = {};
            var innerSchedule = [];
            var teamListArray = [];
            var teamList = [];
            var teamToInsert = {};
            localStorage.eventName = worksheet1["B3"].v;

            for (var i = 0; i < schedule.length; i++) {
                if (schedule[i].Match) {
                    var tempRow = {
                        "description": schedule[i].Description,
                        "tournamentLevel": "Qualification",
                        "matchNumber": schedule[i].Match,
                        "startTime": schedule[i].Time,
                        "actualStartTime": "",
                        "postResultTime": "",
                        "scoreRedFinal": "",
                        "scoreRedFoul": "",
                        "scoreRedAuto": "",
                        "scoreBlueFinal": "",
                        "scoreBlueFoul": "",
                        "scoreBlueAuto": "",
                        "teams": [{
                            "teamNumber": schedule[i]["Red 1"],
                            "station": "Red1",
                            "surrogate": !1,
                            "dq": !1
                        }, {
                            "teamNumber": schedule[i]["Red 2"],
                            "station": "Red2",
                            "surrogate": !1,
                            "dq": !1
                        }, {
                            "teamNumber": schedule[i]["Red 3"],
                            "station": "Red3",
                            "surrogate": !1,
                            "dq": !1
                        }, {
                            "teamNumber": schedule[i]["Blue 1"],
                            "station": "Blue1",
                            "surrogate": !1,
                            "dq": !1
                        }, {
                            "teamNumber": schedule[i]["Blue 2"],
                            "station": "Blue2",
                            "surrogate": !1,
                            "dq": !1
                        }, { "teamNumber": schedule[i]["Blue 3"], "station": "Blue3", "surrogate": !1, "dq": !1 }]
                    };
                    if (teamListArray.indexOf(schedule[i]["Red 1"]) === -1) {
                        teamListArray.push(schedule[i]["Red 1"])
                    }
                    if (teamListArray.indexOf(schedule[i]["Red 2"]) === -1) {
                        teamListArray.push(schedule[i]["Red 2"])
                    }
                    if (teamListArray.indexOf(schedule[i]["Red 3"]) === -1) {
                        teamListArray.push(schedule[i]["Red 3"])
                    }
                    if (teamListArray.indexOf(schedule[i]["Blue 1"]) === -1) {
                        teamListArray.push(schedule[i]["Blue 1"])
                    }
                    if (teamListArray.indexOf(schedule[i]["Blue 2"]) === -1) {
                        teamListArray.push(schedule[i]["Blue 2"])
                    }
                    if (teamListArray.indexOf(schedule[i]["Blue 3"]) === -1) {
                        teamListArray.push(schedule[i]["Blue 3"])
                    }
                    innerSchedule.push(tempRow)
                }
            }
            formattedSchedule.Schedule = innerSchedule;
            teamListArray.sort(function (a, b) {
                return Number(a) - Number(b)
            });
            for (i = 0; i < teamListArray.length; i++) {
                teamToInsert = { "teamNumber": teamListArray[i] };
                teamList.push(teamToInsert)
            }
            $("#eventTeamCount").html(teamList.length);
            $('#teamsListEventName').html(localStorage.eventName);
            $("#teamsTable tbody").empty();
            getTeamData(teamList, localStorage.currentYear);
            localStorage.qualsList = JSON.stringify(formattedSchedule);
            getHybridSchedule();
            $("#QualsFiles").hide();
            $("#QualsFilesReset").show()
        };
        reader.readAsBinaryString(f)
    }
}

function handlePlayoffFiles(e) {
    "use strict";
    var rABS = !0;
    var files = e.target.files;
    var i, f;
    for (i = 0; i !== files.length; ++i) {
        f = files[i];
        var reader = new FileReader();
        reader.onload = function (e) {
            var data = e.target.result;
            var workbook;
            if (rABS) {
                workbook = XLSX.read(data, { type: 'binary' })
            } else {
                var arr = fixdata(data);
                workbook = XLSX.read(btoa(arr), { type: 'base64' })
            }
            var worksheet = workbook.Sheets[workbook.SheetNames[0]];
            var schedule = XLSX.utils.sheet_to_json(worksheet, { range: 4 });
            var formattedSchedule = {};
            var innerSchedule = [];
            for (var i = 0; i < schedule.length; i++) {
                if (schedule[i].Match) {
                    var tempRow = {
                        "description": schedule[i].Description,
                        "tournamentLevel": "Playoff",
                        "matchNumber": schedule[i].Match,
                        "startTime": schedule[i].Time,
                        "actualStartTime": "",
                        "postResultTime": "",
                        "scoreRedFinal": "",
                        "scoreRedFoul": "",
                        "scoreRedAuto": "",
                        "scoreBlueFinal": "",
                        "scoreBlueFoul": "",
                        "scoreBlueAuto": "",
                        "teams": [{
                            "teamNumber": schedule[i]["Red 1"],
                            "station": "Red1",
                            "surrogate": !1,
                            "dq": !1
                        }, {
                            "teamNumber": schedule[i]["Red 2"],
                            "station": "Red2",
                            "surrogate": !1,
                            "dq": !1
                        }, {
                            "teamNumber": schedule[i]["Red 3"],
                            "station": "Red3",
                            "surrogate": !1,
                            "dq": !1
                        }, {
                            "teamNumber": schedule[i]["Blue 1"],
                            "station": "Blue1",
                            "surrogate": !1,
                            "dq": !1
                        }, {
                            "teamNumber": schedule[i]["Blue 2"],
                            "station": "Blue2",
                            "surrogate": !1,
                            "dq": !1
                        }, { "teamNumber": schedule[i]["Blue 3"], "station": "Blue3", "surrogate": !1, "dq": !1 }]
                    };
                    innerSchedule.push(tempRow)
                }
            }
            formattedSchedule.Schedule = innerSchedule;
            localStorage.playoffList = JSON.stringify(formattedSchedule);
            getHybridSchedule();
            $("#PlayoffFiles").hide();
            $("#PlayoffFilesReset").show()
        };
        reader.readAsBinaryString(f)
    }
}

function handleQualsFilesReset() {
    "use strict";
    clearFileInput("QualsFiles");
    document.getElementById("QualsFiles").addEventListener('change', handleQualsFiles, !1);
    $("#QualsFiles").show();
    $("#QualsFilesReset").hide();
    localStorage.qualsList = '{"Schedule":[]}';
    getOffseasonSchedule()
}

function handlePlayoffFilesReset() {
    "use strict";
    clearFileInput("PlayoffFiles");
    document.getElementById("PlayoffFiles").addEventListener('change', handlePlayoffFiles, !1);
    $("#PlayoffFiles").show();
    $("#PlayoffFilesReset").hide();
    localStorage.playoffList = '{"Schedule":[]}';
    getOffseasonSchedule()
}

function clearFileInput(id) {
    "use strict";
    var oldInput = document.getElementById(id);
    var newInput = document.createElement("input");
    newInput.type = "file";
    newInput.id = oldInput.id;
    newInput.name = oldInput.name;
    newInput.className = oldInput.className;
    newInput.style.cssText = oldInput.style.cssText;
    oldInput.parentNode.replaceChild(newInput, oldInput)
}