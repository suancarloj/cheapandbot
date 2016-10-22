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
var intents = new builder.IntentDialog({
    recognizers: [recognizer]
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// const connector = new builder.ConsoleConnector();

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

const baseUrl = 'https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture';
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

const heroCardBuilder = (session) => (image) => {
    const card = new builder.HeroCard(session);
    if (image.subtitle) {
        card.subtitle(image.subtitle);
    }
    return card.images([builder.CardImage.create(session, image.url)])
        .buttons([builder.CardAction.imBack(session, image.value, "Select")])
};


bot.use(function (session, next) {
    console.log(session)
  if (session.message.text === '/deleteprofile') {
      console.log('delte profile')
    session.perUserInConversationData = {};
    session.userData = {};
    session.conversationData = {};
  }
  next();
});

bot.dialog('/', [
    function (session) {
        if (session.userData.firstTime) {
            builder.Prompts.confirm(session, 'Hi! Are your looking for a new outfit ?');
        } else {
            session.send('Welcome back Sir,  Are your looking for a new outfit ?');
            session.beginDialog('/cheap');
        }
    },
    function (session, results) {
        const response = results.response;
        //console.log("Response ",response);
        if (!response) {
            session.endDialog();
        } else {
            session.beginDialog('/cheap');
        }
    }
]);

bot.dialog('/cheap', [
    /* Step 1 */
    function (session) {
        session.send('What do you like to wear in your free time?');
        // Ask the user to select an item from a carousel.
        const images = [
            { url: `${baseUrl}/dt-2360_728x972_e.pjpeg`, value: 'select:100' },
            { url: `${baseUrl}/dt-2360_728x972_d.pjpeg`, value: 'select:101' },
            { url: `${baseUrl}/dt-2360_728x972_c.pjpeg`, value: 'select:102' },
        ]
        const msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(images.map(heroCardBuilder(session)));
        builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    },
    function (session, results, next) {
        var action, item;
        var kvPair = results.response.entity.split(':');
        if (!session.userData.selected) {
            session.userData.selected = [];
        }
        session.userData.selected.push(kvPair[1]);
        session.userData.firstTime = false;
        session.beginDialog('/cheap-step2');

    },

]);

bot.dialog('/cheap-step2', [ /* Step 2*/
    function (session, results, next) {
        session.send("What do you wear to work? ")
        const images = [            
            { url: `${baseUrl}/dt-2045_728x972_business.pjpeg`, value: 'business' },
            { url: `${baseUrl}/work_relaxed_2.pjpeg`, value: 'casual' },
            { url: `${baseUrl}/dt-2045_728x972_modernclassic02.pjpeg`, value: 'business' },
            { url: `${baseUrl}/work_casual.pjpeg`, value: 'casual' }
        ]
        const msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(images.map(heroCardBuilder(session)));
        builder.Prompts.choice(session, msg, "casual|business");
    },
    function (session, results, next) {
        const response = results.response.entity;
        const CASUAL = 'casual';
        const business = 'business'
        session.userData.selected.push(response);
        session.beginDialog('/cheap-step3');

    }
]);

bot.dialog('/cheap-step3', [ /* Step 3 : Shoes*/
    function (session, results, next) {
        session.send("Which shoes would you wear?")
        const images = [
            { url: `${baseUrl}/dt-2360_schuhe_sneakers.pjpeg`, value: 'basket' },
            { url: `${baseUrl}/dt-2438_schuhe_boat.pjpeg`, value: 'sebago' },
            { url: `${baseUrl}/dt-2360_schuhe_boots.pjpeg`, value: 'boot' },
            { url: "http://counterintuity.com/wp-content/uploads/2015/09/897px-Not_facebook_not_like_thumbs_down.png", subtitle: "I don't like any of these shoes", value: 'dislike' }
        ]
        const msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(images.map(heroCardBuilder(session)));
        builder.Prompts.choice(session, msg, "basket|sebago|boot|dislike");
    },
    function (session, results, next) {
        const response = results.response.entity;

        if (response !== 'dislike') {
            session.endDialog();
            session.beginDialog('/cheap-step4');
        }

        session.send('Oh daam, we feel bad that you find nothing :( ')
        builder.Prompts.text(session, 'So, Could you specify what kinds of shoes you like ?');
    },
    function (session, results, next) {
        session.send('Thanks for the informations, we will use it');
        const response = results.response;
        session.userData.selected.push(response);
        session.send('Great we can continue the inception');
        session.beginDialog('/cheap-step4');
    }
])

bot.dialog('/cheap-step4', [
    function (session, result, next) {
        session.send('Welcome step 4');
        session.endConversation()
    }
])