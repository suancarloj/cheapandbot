'use strict';

var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var fs = require('fs');
var cloudconvert = new (require('cloudconvert'))('wx83QtW1eQf5Xgg3Tx5vNsuhZb1izluSeOQtXJkQaxlfF7dO5cA-7L43l1SkG0BBlkGDHIfFzePpWd4OgYsLBw');
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

var baseUrl = 'https://www.outfittery.com/funnels/new/img/thumb__questionnaire_picture';
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

var heroCardBuilder = function heroCardBuilder(session) {
    var buttonText = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Select';
    return function (image) {
        var card = new builder.HeroCard(session);
        if (image.subtitle) {
            card.subtitle(image.subtitle);
        }
        return card.images([builder.CardImage.create(session, image.url)]).buttons([builder.CardAction.imBack(session, image.value, buttonText)]);
    };
};

var getImageValues = function getImageValues(images) {
    return images.map(function (image) {
        return image.value;
    }).join('|');
};

bot.use({
    botbuilder: function botbuilder(session, next) {
        if (session.message.text === '/deleteprofile') {
            session.reset();
            session.perUserInConversationData = {};
            session.userData = {};
            session.conversationData = {};
            session.sessionState = {};
            session.save();
        }
        next();
    }
});

bot.dialog('/', [function (session) {

    if (session.userData.firstTime) {
        builder.Prompts.confirm(session, 'Hi! Are your looking for a new outfit ?');
    } else {
        session.send('Welcome back Sir,  Are your looking for a new outfit ?');
        session.beginDialog('/speech');
    }
}, function (session, results) {
    var response = results.response;
    //console.log("Response ",response);
    if (!response) {
        session.endDialog();
    } else {
        session.beginDialog('/speech');
    }
}]);

bot.dialog('/cheap', [
/* Step 1 */
function (session) {
    session.send('What do you like to wear in your free time?');
    // Ask the user to select an item from a carousel.
    var images = [{ url: baseUrl + '/dt-2360_728x972_e.pjpeg', value: 'select:100' }, { url: baseUrl + '/dt-2360_728x972_d.pjpeg', value: 'select:101' }, { url: baseUrl + '/dt-2360_728x972_c.pjpeg', value: 'select:102' }];
    var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(images.map(heroCardBuilder(session)));
    builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
}, function (session, results, next) {
    var action, item;
    var kvPair = results.response.entity.split(':');
    if (!session.userData.selected) {
        session.userData.selected = [];
    }
    session.userData.selected.push(kvPair[1]);
    session.userData.firstTime = false;
    session.beginDialog('/cheap-step2');
}]);

bot.dialog('/cheap-step2', [/* Step 2*/
function (session, results, next) {
    session.send("What do you wear to work? ");
    var images = [{ url: baseUrl + '/dt-2045_728x972_business.pjpeg', value: 'business' }, { url: baseUrl + '/work_relaxed_2.pjpeg', value: 'casual' }, { url: baseUrl + '/dt-2045_728x972_modernclassic02.pjpeg', value: 'business' }, { url: baseUrl + '/work_casual.pjpeg', value: 'casual' }];
    var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(images.map(heroCardBuilder(session)));
    builder.Prompts.choice(session, msg, "casual|business");
}, function (session, results, next) {
    var response = results.response.entity;
    var CASUAL = 'casual';
    var business = 'business';
    session.userData.selected.push(response);
    session.beginDialog('/cheap-step3');
}]);

bot.dialog('/cheap-step3', [/* Step 3 : Shoes*/
function (session, results, next) {
    session.send("Which shoes would you wear?");
    var images = [{ url: baseUrl + '/dt-2360_schuhe_sneakers.pjpeg', value: 'basket' }, { url: baseUrl + '/dt-2438_schuhe_boat.pjpeg', value: 'sebago' }, { url: baseUrl + '/dt-2360_schuhe_boots.pjpeg', value: 'boot' }, { url: "http://counterintuity.com/wp-content/uploads/2015/09/897px-Not_facebook_not_like_thumbs_down.png", subtitle: "I don't like any of these shoes", value: 'dislike' }];
    var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(images.map(heroCardBuilder(session)));
    builder.Prompts.choice(session, msg, getImageValues(images));
}, function (session, results, next) {
    var response = results.response.entity;

    if (response !== 'dislike') {
        session.beginDialog('/cheap-step4');
    } else {
        session.send('Oh daam, we feel bad that you find nothing :( ');
        builder.Prompts.text(session, 'So, Could you specify what kinds of shoes you like ?');
    }
}, function (session, results, next) {
    session.send('Thanks for the informations, we will use it');
    var response = results.response;
    session.userData.selected.push(response);
    session.send('Great we can continue the inception');
    session.beginDialog('/cheap-step4');
}]);

bot.dialog('/cheap-step4', [function (session, result, next) {
    session.send('What would you never wear?');
    var images = [{ url: baseUrl + '/dt-2360_bittenicht_polo.pjpeg', value: 'polo' }, { url: baseUrl + '/dt-2360_bitte-nicht-teile_coloured-chino.pjpeg', value: 'chino' }, { url: baseUrl + '/dt-2438_bittenicht_shorts.pjpeg', value: 'shorts' }, { url: baseUrl + '/dt-2360_bittenicht_bottom-down.pjpeg', value: 'down' }];

    var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(images.map(heroCardBuilder(session, 'Never')));
    builder.Prompts.choice(session, msg, getImageValues(images));
    // session.endConversation()
}, function (session, results, next) {
    var response = results.response.entity;
    session.userData.selected.push(response);
    session.beginDialog('/cheap-step-5');
}]);

bot.dialog('/cheap-step-5', [function (session, result, next) {
    session.send('Which brands do you like?');
    var images = [{ url: baseUrl + '/_0038_bugatti.pjpeg', value: 'bugatti' }, { url: baseUrl + '/_0055_lee.pjpeg', value: 'lee' }, { url: baseUrl + '/_0040_gstar_raw.pjpeg', value: 'gstar-raw' }, { url: baseUrl + '/_0032_tommy_hilfiger.pjpeg', value: 'tommy-hilfiger' }];

    var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(images.map(heroCardBuilder(session, 'Favorite')));
    builder.Prompts.choice(session, msg, getImageValues(images));
}, function (session, results, next) {
    console.log(results.response);
    var response = results.response.entity;
    session.userData.selected.push(response);
    session.beginDialog('/cheap-step-6');
}]);

bot.dialog('/cheap-step-6', [function (session, result, next) {
    builder.Prompts.number(session, 'How old do you feel ?');
}, function (session, results, next) {
    var response = results.response;
    session.userData.selected.push(response);
    session.beginDialog('/final');
}]);

bot.dialog('/final', [function (session, result, next) {
    session.endDialog('That is it, I will contact you ');
}, function (session, results, next) {}]);

var uploadSpeech = function uploadSpeech(dataFile, language, API_USER_ID, token, cb) {
    var formData = {
        diarisation: 'true',
        model: language,
        data_file: dataFile,
        notification: 'none'
    };
    //API CALL: Upload file for transcription.
    var apiUploadURL = 'https://api.speechmatics.com/v1.0/user/' + API_USER_ID + '/jobs/?auth_token=' + token;
    request.post({ url: apiUploadURL, formData: formData }, function (error, response, body) {
        if (error) {
            console.log('\nREQUEST ERROR:', error);
            cb(error, null);
            return;
        }

        try {
            var json = JSON.parse(body);
            if (json.error) {
                console.log('\nAPI ERROR', json.error);
                cb(json.error, null);
                return;
            }

            cb(null, json);
        } catch (parseError) {
            console.log('\nPARSE ERROR', parseError);
            cb(parseError, null);
            return;
        }

        console.log('\nSpeechmatics job uploaded. Job ID:', json.id);
    });
};

//API CALL: Download transcription by job ID.
var downloadUrl = function downloadUrl(appUserId, jobID, token, cb) {
    var apiDownloadURL = 'https://api.speechmatics.com/v1.0/user/' + appUserId + '/jobs/' + jobID + '/transcript?auth_token=' + token;

    request(apiDownloadURL, function (error, response, body) {
        if (error) {
            console.log('\nREQUEST ERROR:', error);
            cb(err, null);
            return;
        }

        try {
            var json = JSON.parse(body);
            if (json.error) {
                console.log('\nAPI ERROR', json.error);
                cb(json.error, null);
                return;
            }
            cb(null, json);
        } catch (parseError) {
            console.log('\nPARSE ERROR', parseError);
            cb(parseError, null);
            return;
        }
    });
};

bot.dialog('/speech', [function (session, result, next) {
    builder.Prompts.attachment(session, "Upload a audio for me to transform.");
}, function (session, result, next) {
    console.log("res", result.response);
    session.sendTyping();
    var stream = void 0;
    request(result.response[0].contentUrl).pipe(fs.createWriteStream('../song.mp4')).on('finish', function () {
        console.log('Done wrting!');
        session.sendTyping();
        stream = fs.createReadStream('../song.mp4').pipe(cloudconvert.convert({
            inputformat: 'mp4',
            outputformat: 'mp3'
        })).pipe(fs.createWriteStream('out.mp3')).on('finish', function () {
            console.log('Done cloud convert!');
            session.sendTyping();
            var token = 'NDhjZjRhY2MtOTRmMi00MWY2LWExNGItOTlmMGE4MDQ3YjIw';
            var appUserId = 8967;
            uploadSpeech(fs.createReadStream('out.mp3'), 'en-US', appUserId, token, function (err, res) {
                if (err) {
                    session.send("We had a error to upload ");
                } else {
                    setTimeout(function () {
                        downloadUrl(appUserId, res.id, token, function (err, response) {
                            if (err) {
                                session.send('There was an error with your');
                            } else {
                                var message = response.words.join(' ');
                                session.send('Success  ' + message);
                            }
                        });
                    }, res.check_wait * 1000);
                }
            });
        });
    });
}]);
//session.endDialog('That is it, I will contact you ');