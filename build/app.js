'use strict';

var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
var PORT = process.env.port || process.env.PORT || 3978;
server.listen(PORT, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// 
var recognizer = new builder.LuisRecognizer('https://api.projectoxford.ai/luis/v1/application?id=b1c4a2d5-5503-4faf-83cc-6ddf84345c14&subscription-key=a74853438484421ab06d0b8f174aa68c');

// 
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// const connector = new builder.ConsoleConnector();

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================


bot.dialog('/', intents);

intents.onBegin(function (session, args, next) {
    // session.dialogData.name = args.name;
    session.send("hi !");
    next();
});

intents.matches('BuyWear', [function (session, args) {
    builder.Prompts.text(session, "What kind of wear do you want to buy today ?");
    console.log('args', args);
    var item = builder.EntityRecognizer.findEntity(args.entities, "shoes");
    console.log('item', item);
}]);

intents.onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."));