function getAPIRequest() {
	"use strict";
	console.log($("#apiInput").val());
	
	var req = new XMLHttpRequest();
	req.open("GET", "https://frc-api.firstinspires.org/v2.0/" + $("#apiInput").val());
	req.setRequestHeader("Authorization", "Basic bG9ja2phdzh5OTpGNkQ5NDJBMS1FQjlDLTRCRUYtQjQyNC01MkMxMTNCRkYyOTA=");
	req.setRequestHeader("Accept", "application/json");
	req.setRequestHeader("Access-Control-Allow-Origin", "*"); // Required for CORS support to work
	req.setRequestHeader("Content-Type", "application/json");
	req.setRequestHeader("charset", "utf-8");
	req.addEventListener("load", function () {
		$("#apiResponse").html(req.responseText);
	});
	req.send();
}