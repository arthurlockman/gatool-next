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
    localStorage.eventName = data.name.replace("- FIRST Robotics Competition -","-");
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
        var _option = { text: tmp[i].name.replace("- FIRST Robotics Competition -","-"), value: tmp[i] };
        options.push(_option);
        events[tmp[i].code] = tmp[i].name.replace("- FIRST Robotics Competition -","-");
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
        if (option.value.type === "OffSeason") {
            optionClass = "bg-warning";
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
    if (localStorage.offseason === "true") {
        endpoint = "/offseasonteamsv2/";
    }
    if (localStorage.offseason === "true") {
        req.open('GET', apiURL + year + endpoint + localStorage.currentEvent + "/1");
    } else {
        req.open('GET', apiURL + year + endpoint + localStorage.currentEvent);
    }
    
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
                        appearanceDisplay += "<b>Chairman's Award</b><br> " + allAwardsData.chairmansyears.join(", ") + "<br>";
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
                    if (allAwardsData.deansList === 1) {
                        appearanceDisplay += "<b>Dean's List Awardee</b><br>";
                    }
                    if (allAwardsData.deansList > 1) {
                        appearanceDisplay += "<b>" + allAwardsData.deansList + " Dean's List Awardees</b><br>";
                    }
                    if (allAwardsData.deansListyears.length > 0) {
                        appearanceDisplay += allAwardsData.deansListyears.join(", ") + "<br>";
                    }
                    if (allAwardsData.voy === 1) {
                        appearanceDisplay += "<b>Volunteer of the Year</b><br>";
                    }
                    if (allAwardsData.voy > 1) {
                        appearanceDisplay += "<b>" + allAwardsData.voy + " Volunteers of the Year</b><br>";
                    }
                    if (allAwardsData.voyyears.length > 0) {
                        appearanceDisplay += allAwardsData.voyyears.join(", ") + "<br>";
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
    message += '<div id = "substituteTeamInput" class="form-group"><label for="substituteTeamUpdate">Substitute Team Entry</label><input inputmode="numeric" pattern="[0-9]*" type="text" class="form-control" id="substituteTeamUpdate" placeholder="Enter a Team Number"></div>';
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
    eventNames[String(year)] = JSON.parse(localStorage.events);
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
                if ((data.Awards !== '{"Awards":[]}') || (data.includes("Malformed Parameter"))) {
                    for (var i = 0; i < data.Awards.length; i++) {
                        awardName = data.Awards[i].name;
                        awardHilight = awardsHilight(awardName);
                        if (awardName === "Volunteer of the Year") {
                            awardName += " "+data.Awards[i].person;
                            if (champs.indexOf(data.Awards[i].eventCode) >= 0) {
                                awardHilight = { "before": "<span class ='awardHilight'>", "after": "</span>" };
                            }
                        }
                        awards += '<span class="awardsDepth' + String(j + 1) + '">' + awardHilight.before + data.year + ' <span class="awardsEventName">' + eventNames[data.year][data.Awards[i].eventCode].replace("- FIRST Robotics Competition -","-") + '</span><span class="awardsEventCode">' + data.Awards[i].eventCode + '</span>: ' + awardName + awardHilight.after;
                        flatAwards += data.year + " " + eventNames[data.year][data.Awards[i].eventCode].replace("- FIRST Robotics Competition -","-") + ": " + awardName + String.fromCharCode(10);
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
        $("#teamTableNumber"+ eventTeamList[j].teamNumber).removeClass("btn-success");
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
        lastVisit = moment(teamInfo.lastVisit).fromNow();
    }
    var returnData = '<tr class="teamsTableRow"><td class = "btn-default';
    if (lastVisit !== "No recent visit") {
        returnData += " btn-success";
    }
    returnData +='" id="teamTableNumber' + teamData.teamNumber + '" onclick="updateTeamInfo(' + teamData.teamNumber + ')"><span class="teamDataNumber">' + teamData.teamNumber + '</span><br><span id="lastVisit' + teamData.teamNumber + '" teamNumber = "' + teamData.teamNumber + '"  lastvisit = "' + teamInfo.lastVisit + '">' + lastVisit + '</span></td>';
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
        lastVisit = moment(teamInfo.lastVisit).fromNow();
    }
    returnData += '<tr class="teamsTableRow"><td class = "btn-default';
    if (lastVisit !== "No recent visit") {
        returnData += " btn-success";
    }
    returnData += '" id="teamTableNumber' + teamData.teamNumber + '" onclick="updateTeamInfo(' + teamData.teamNumber + ')"><span class="teamDataNumber">' + teamData.teamNumber + '</span><br><span id="lastVisit' + teamData.teamNumber + '" teamNumber = "' + teamData.teamNumber + '" lastvisit = "' + teamInfo.lastVisit + '">' + lastVisit + '</span></td>';
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