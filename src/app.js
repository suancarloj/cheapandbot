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

const heroCardBuilder = (session, buttonText = 'Select') => (image) => {
    const card = new builder.HeroCard(session);
    if (image.subtitle) {
        card.subtitle(image.subtitle);
    }
    return card.images([builder.CardImage.create(session, image.url)])
        .buttons([builder.CardAction.imBack(session, image.value, image.text || buttonText)])
};

const getImageValues = (images) => images.map(image => image.value).join('|'); 

bot.use({
    botbuilder: function botbuilder(session, next) {
        if (session.message.text === '/deleteprofile') {
            session.reset();
            session.perUserInConversationData = {};
            session.userData = {
                firstTime: true
            };
            session.conversationData = {};
            session.sessionState = {};
            session.save();
            session.endConversation('See you');
        } else if (!session.userData.firstRun) {
            session.userData.firstRun = true;
            session.beginDialog('/firstRun');
        } else {
            next();
        }
    }
});

bot.dialog('/firstRun', [
    function (session) {
        session.sendTyping();
        session.send('Hello!')
        session.sendTyping();
        session.send("I'm Chip the bot, your personal stylist assistant. 👒👟👡👕👔👗👘")
        session.sendTyping();
        session.send('To find you the best style, I need to know you. 😄')
        session.sendTyping();
        session.send('So, for this purpose, I will ask several questions')
        session.replaceDialog('/cheap'); 
    }
])

bot.dialog('/', [
    function (session) {
        if (!session.userData.firstRun) {
            session.send('Welcome back Sir, are you looking for a new outfit ?');
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
            { url: `${baseUrl}/dt-2360_728x972_e.pjpeg`, value: 'select:100', text: 'I work all the time' },
            { url: `${baseUrl}/dt-2360_728x972_d.pjpeg`, value: 'select:101', text: "I'm a model" },
            { url: `${baseUrl}/dt-2360_728x972_c.pjpeg`, value: 'select:102', text: "I'm a cool guy" },
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
            { url: `${baseUrl}/dt-2045_728x972_business.pjpeg`, value: 'business' , text: "It's all about business for me"},
            { url: `${baseUrl}/work_relaxed_2.pjpeg`, value: 'casual' , text: 'I like my style to stay fresh'},
            { url: `${baseUrl}/dt-2045_728x972_modernclassic02.pjpeg`, value: 'business', text: "I'm a modern kind of guy" },
            { url: `${baseUrl}/work_casual.pjpeg`, value: 'casual', text: 'Shirts are my thing!' }
        ]
        const msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(images.map(heroCardBuilder(session)));
        builder.Prompts.choice(session, msg, "casual|business");
    },
    function (session, results, next) {
        const response = results.response.entity;
        const CASUAL = 'casual';
        const business = 'business';
        
        session.userData.selected.push(response);
        session.beginDialog('/cheap-step3');

    }
]);

bot.dialog('/cheap-step3', [ /* Step 3 : Shoes*/
    function (session, results, next) {
        session.send("Which shoes would you wear?")
        const images = [
            { url: `${baseUrl}/dt-2360_schuhe_sneakers.pjpeg`, value: 'basket', text: 'Adidas dude!' },
            { url: `${baseUrl}/dt-2438_schuhe_boat.pjpeg`, value: 'sebago', text: 'Sebago is my thing' },
            { url: `${baseUrl}/dt-2360_schuhe_boots.pjpeg`, value: 'boot', text: 'I like to keep my feets warm' },
            { url: "http://counterintuity.com/wp-content/uploads/2015/09/897px-Not_facebook_not_like_thumbs_down.png", subtitle: "I don't like any of these shoes", value: 'dislike', text: 'None of those' }
        ]
        const msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(images.map(heroCardBuilder(session)));
        builder.Prompts.choice(session, msg, getImageValues(images));
    },
    function (session, results, next) {
        const response = results.response.entity;

        if (response !== 'dislike') {
            session.replaceDialog('/cheap-step4');
        } else {
            session.send('Oh daam, we feel bad that you find nothing :( ')
            builder.Prompts.text(session, 'So, Could you specify what kinds of shoes you like ?');
        }
    },
    function (session, results, next) {
        session.send('Thanks for the informations, we will take it into account');
        const response = results.response;
        session.userData.selected.push(response);
        session.send('Great we can continue the inception');
        session.beginDialog('/cheap-step4');
    }
])

bot.dialog('/cheap-step4', [
    function (session, result, next) {
        session.send('What would you never wear?');
        const images = [
            { url: `${baseUrl}/dt-2360_bittenicht_polo.pjpeg`, value: 'polo', text: "Not from the BW!" },
            { url: `${baseUrl}/dt-2360_bitte-nicht-teile_coloured-chino.pjpeg`, value: 'chino', text: "No Chino's, please" },
            { url: `${baseUrl}/dt-2438_bittenicht_shorts.pjpeg`, value: 'shorts', text: "Shorts" },
            { url: `${baseUrl}/dt-2360_bittenicht_bottom-down.pjpeg`, value: 'down', text: "No shirt!" }
        ]

        const msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(images.map(heroCardBuilder(session, 'I see')));
        builder.Prompts.choice(session, msg, getImageValues(images));
        // session.endConversation()
    },
    function (session, results, next) {
        const response = results.response.entity;
        session.userData.selected.push(response);
        session.beginDialog('/cheap-step-5');
    }
])

bot.dialog('/cheap-step-5', [
    function (session, result, next) {
        session.send('Which brands do you like?')
        const images = [
            { url: `${baseUrl}/_0038_bugatti.pjpeg`, value: 'bugatti', text: 'I like expensive stuff'},  
            { url: `${baseUrl}/_0055_lee.pjpeg`, value: 'lee', text: 'Lee is the thing'},
            { url: `${baseUrl}/_0040_gstar_raw.pjpeg`, value: 'gstar-raw', text: 'Get me some raw'},
            { url: `${baseUrl}/_0032_tommy_hilfiger.pjpeg`, value: 'tommy-hilfiger', text: 'Tommy !'},
        ];

        const msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(images.map(heroCardBuilder(session, 'You seem to like the good stuff')));
        builder.Prompts.choice(session, msg, getImageValues(images));
    },
    function (session, results, next) {
        console.log(results.response);
        const response = results.response.entity;
        session.userData.selected.push(response);
        session.beginDialog('/cheap-step-6');
    }
])

bot.dialog('/cheap-step-6', [
    function (session, result, next) {
        builder.Prompts.number(session, 'How old do you feel ?');
    },
    function (session, results, next) {
        const response = results.response;
        if (response < 16) {
            session.send('Ask your mom dude!')
            const msg = new builder.Message(session)
                .attachments([{
                    contentType: 'image/jpeg',
                    contentUrl: 'https://cdn.meme.am/instances/500x/30373650.jpg'
                }]);
            session.endDialog(msg);
            session.endConversation();
            return ;
        }
        session.userData.selected.push(response);
        session.beginDialog('/final');
    }
])

bot.dialog('/final', [
    function (session, result, next) {
        session.endDialog('That is it, I will contact you ');
    },
    function (session, results, next) {
        
    }
])

var uploadSpeech = function uploadSpeech(dataFile, language, API_USER_ID, token, cb) {
    var formData = {
        diarisation: 'true',
        model: language,
        data_file:dataFile ,
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
const downloadUrl = (appUserId, jobID, token, cb) => {
    var apiDownloadURL = 'https://api.speechmatics.com/v1.0/user/' + appUserId + '/jobs/' + jobID + '/transcript?auth_token=' + token;

	request(apiDownloadURL, function (error, response, body) {
	    if (error) {
	        console.log('\nREQUEST ERROR:', error);
			cb(err,null);
			return;
	    }

	    try {
	        var json = JSON.parse(body);
	        if (json.error) {
	            console.log('\nAPI ERROR', json.error);
				cb(json.error,null);
				return;
	        }
			cb(null,json);
	    } catch (parseError) {
	        console.log('\nPARSE ERROR', parseError);
			cb(parseError,null)
			return;
	    }

	});
}

bot.dialog('/speech', [
    function (session, result, next) {
        builder.Prompts.attachment(session, "Upload a audio for me to transform.");
    },
    function (session, result, next) {
        console.log("res", result.response);
        session.sendTyping();
        let stream;
        request(result.response[0].contentUrl)
        .pipe(fs.createWriteStream('../song.mp4'))
        .on('finish', function() {
            console.log('Done wrting!');
            session.sendTyping();
            stream = fs.createReadStream('../song.mp4')
            .pipe(cloudconvert.convert({
                inputformat: 'mp4',
                outputformat: 'mp3'
            }))
            .pipe(fs.createWriteStream('out.mp3'))
            .on('finish', function() {
                console.log('Done cloud convert!');
                session.sendTyping();
                const token = 'NDhjZjRhY2MtOTRmMi00MWY2LWExNGItOTlmMGE4MDQ3YjIw';
                const appUserId = 8967;
                uploadSpeech(fs.createReadStream('out.mp3'), 'en-US', appUserId, token, function (err, res) {
                    if (err) {
                        session.send("We had a error to upload ");
                    } else {
                        setTimeout(() => {
                            downloadUrl(appUserId, res.id, token, (err, response) => {
                                if (err) {
                                    session.send('There was an error with your');
                                } else {
                                    const message = response.words.map(word => word.name).join(' ');
                                    session.send(`Success  ${message}`);
                                }
                            });
                        }, res.check_wait * 1000);
                    }
                });
            });  
        });
    }
]);
    //session.endDialog('That is it, I will contact you ');