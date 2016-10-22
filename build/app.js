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


// bot.dialog('/', intents);

// intents.onBegin(function (session, args, next) {
//     // session.dialogData.name = args.name;
//     session.send("hi !");
//     next();
// });

// intents.matches('BuyWear', [function (session, args) {
//     builder.Prompts.text(session, "What kind of wear do you want to buy today ?");
//     console.log('args', args);
//     var item = builder.EntityRecognizer.findEntity(args.entities, "shoes");
//     console.log('item', item);
// }]);

// intents.onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."));


bot.dialog('/', [function (session) {
    builder.Prompts.confirm(session, 'Hi! Are your looking for a new outfit ?');
}, function (session, results) {
    var response = results.response;
    if (response.toLowerCase() === "no") {
        session.endDialog();
    } else {
        session.beginDialog('/cheap');
    }
}]);

bot.dialog('/cheap', [
/* Step 1 */
function (session) {
    session.send('What do you like to wear in your free time?');
    // Ask the user to select an item from a carousel.
    var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments([new builder.HeroCard(session).images([builder.CardImage.create(session, "https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture/dt-2360_728x972_e.pjpeg").tap(builder.CardAction.showImage(session, "https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture/dt-2360_728x972_e.pjpeg"))]).buttons([builder.CardAction.imBack(session, "select:100", "Select")]), new builder.HeroCard(session).images([builder.CardImage.create(session, "https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture/dt-2360_728x972_d.pjpeg").tap(builder.CardAction.showImage(session, "https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture/dt-2360_728x972_d.pjpeg"))]).buttons([builder.CardAction.imBack(session, "select:101", "Select")]), new builder.HeroCard(session).images([builder.CardImage.create(session, "https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture/dt-2360_728x972_c.pjpeg").tap(builder.CardAction.showImage(session, "https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture/dt-2360_728x972_c.pjpeg"))]).buttons([builder.CardAction.imBack(session, "select:102", "Select")])]);
    builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
}, function (session, results, next) {
    var action, item;
    var kvPair = results.response.entity.split(':');
    if (!session.userData.selected) {
        session.userData.selected = [];
    }
    session.userData.selected.push(kvPair[1]);
    next();
},
/* Step 2*/
function () {
    session.send("What do you wear to work? ");

    var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments([new builder.HeroCard(session).images([builder.CardImage.create(session, "https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture/dt-2045_728x972_business.pjpeg").tap(builder.CardAction.imBack(session, "business"))]), new builder.HeroCard(session).images([builder.CardImage.create(session, "https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture/work_relaxed_2.pjpeg").tap(builder.CardAction.imBack(session, "casual"))]), new builder.HeroCard(session).images([builder.CardImage.create(session, "https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture/dt-2045_728x972_modernclassic02.pjpeg").tap(builder.CardAction.imBack(session, "business"))]), new builder.HeroCard(session).images([builder.CardImage.create(session, "https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture/work_casual.pjpeg").tap(builder.CardAction.imBack(session, "casual"))])]);
    builder.Prompts.choice(session, msg, "casual|business");
}, function (session, results, next) {
    var response = results.response.entity;
    var CASUAL = 'casual';
    var business = 'business';
    session.userData.selected.push(response);

    if (response === CASUAL) {
        session.beginDialog('/cheap-casual');
    } else {
        session.beginDialog('/cheap-business');
    }
}]);

bot.dialog('/cheap-casual', [
/* Step cheap casual part */
function (session) {
    session.send('What do you like to wear in your free time?');
}, function (session, results, next) {}]);

bot.dialog('/cheap-casual', [
/* Step cheap business part */
function (session) {
    session.send('What do you like to wear in your free time?');
}, function (session, results, next) {}]);