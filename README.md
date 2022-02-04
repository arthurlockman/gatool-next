# GATool

[![Build Status](https://travis-ci.org/arthurlockman/gatool-next.svg?branch=master)](https://travis-ci.org/arthurlockman/gatool-next)

This project is the next version of the GATool, deployed into Amazon Web Services. This project is currently in development, and shouldn't be used for GATool's production workload yet.

GATool is a tool used by *FIRST®* Robotics game announcers to view data in real time that they can use to host matches and provide play-by-play coverage of FRC matches.

## Issues and Pull Requests

If you notice issues with the GATool and would like to submit an issue report, please use the [GitHub issue tracker](https://github.com/arthurlockman/gatool-next/issues/new) to open a new ticket.

If you would like to help improve GATool, please feel free to submit a pull request.

## Installing

The project dependencies are installed using npm. The backend project is built and deployed using the [Serverless library](https://serverless.com). To install all dependencies, run this script:

    npm install -g serverless
    npm install

This will install the Serverless command-line tool globally, and then install the local npm dependencies for the project.

## Running Offline

The backend project can be built and run offline using the Serverless offline plugin. To do this, run this command:

    serverless offline start

This will start the project running locally for testing, and will simulate how the functions will run when deployed into AWS as Lambda functions. The local URL for testing will likely be `http://localhost:3000/`, though depending on your serverless settings it may be different. Serverless will print the local URL to the command line when run.

## Deployment

The service and UI are deployed to AWS using the Serverless tools and a few plugins. For simplicity they have been rolled up into a single npm command:

    npm run deploy

This command should *never* be run locally, as deployment is handled automatically through Travis CI.
