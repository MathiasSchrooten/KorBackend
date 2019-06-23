const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');


var logger = require('morgan');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const corsOpts = {
    origin: '*',

    methods: [
        'GET',
        'POST',
    ],

    allowedHeaders: [
        'Content-Type',
        'content-type'
    ],
};

app.use(cors(corsOpts));

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

const dialogflow = require('dialogflow');
const sessionClientKor = new dialogflow.SessionsClient({ keyFilename: "kor/imc-axsbio-1b701901777b.json"});
const contextClientKor = new dialogflow.ContextsClient({ keyFilename: "kor/imc-axsbio-1b701901777b.json"});

app.get('/test', function(req, res) {
   res.send("Test received");
});

app.post('/kor/getBotResponse', async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://mathiasschrooten.github.io/dialogflow-web-v2/');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    let text = req.body.text;
    let projectId = 'imc-axsbio';
    let sessionPath = sessionClientKor.sessionPath(projectId, "1");

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'ko'
            }
        }
    };

    try {
        sessionClientKor.detectIntent(request)
            .then(async responses => {
                let response = "";
                let responsesArray = [10];
                let result = responses[0];
                let mp3url = false;
                let imageUrl = false;
                let pdfUrl = false;
                let videoUrl = false;
                let isAttachment = false;
                let isMulti = false;
                let userText = "";
                let botText = "";
                let botReplyInMulti = false;

                console.log("length of fulfillmentMessages = " + responses[0].queryResult.fulfillmentMessages.length);

                if (responses[0].queryResult.fulfillmentMessages.length > 1) {
                    console.log("more than 1 fulfillmentMessage!");
                    for (let i = 0; i < responses[0].queryResult.fulfillmentMessages.length; i++) {
                        let fulfillment = responses[0].queryResult.fulfillmentMessages[i];
                        console.log("fulfillmentMessage #" + i);
                        console.log(responses[0].queryResult.fulfillmentMessages[i]);
                        if (fulfillment.payload) {
                            if (fulfillment.payload.fields) {
                                if (fulfillment.payload.fields.mp3url) {
                                    mp3url = fulfillment.payload.fields.mp3url.stringValue;
                                    isMulti = true;
                                }
                                if (fulfillment.payload.fields.imageUrl) {
                                    imageUrl = fulfillment.payload.fields.imageUrl.stringValue;
                                    isMulti = true;
                                }
                                if (fulfillment.payload.fields.pdfUrl) {
                                    pdfUrl = fulfillment.payload.fields.pdfUrl.stringValue;
                                    isMulti = true;

                                }
                                if (fulfillment.payload.fields.videoUrl) {
                                    videoUrl = fulfillment.payload.fields.videoUrl.stringValue;
                                    isMulti = true;

                                }
                            }
                        }
                        if (fulfillment.simpleResponses) {
                            botText = fulfillment.simpleResponses.simpleResponses[0].textToSpeech;
                        } else if (fulfillment.text) {
                            botText = fulfillment.text.text[0]
                        }
                        console.log(">>>>>>>>>>>>>>>>>>>>>>>>> botText =");
                        console.log(botText);
                    }


                    for (let i = 0; i < responses[0].queryResult.fulfillmentMessages.length; i++) {
                        let fulfillment = responses[0].queryResult.fulfillmentMessages[i];


                        if (fulfillment.platform === 'ACTIONS_ON_GOOGLE') {
                            if (isMulti) {
                                botReplyInMulti = true;
                                response = {
                                    name: "multi",
                                    content: botText,
                                    mp3url: mp3url,
                                    imageUrl: imageUrl,
                                    pdfUrl: pdfUrl,
                                    videoUrl: videoUrl
                                };
                                responses[0].queryResult.fulfillmentMessages[i] = response;
                                console.log("===== returning multi ====== ");
                                console.log(response);

                            } else {
                                //TODO: this else may be a problem with suggestions...
                                if (fulfillment.suggestions) {
                                    if (fulfillment.suggestions) {
                                        console.log("SUGGESTIONS FOUND!!!!!");
                                        let numberOfButtons = fulfillment.suggestions.suggestions.length;
                                        let buttons = [];

                                        for (let j = 0; j < numberOfButtons; j++) {
                                            let b = fulfillment.suggestions.suggestions[j].title;
                                            buttons.push(b);
                                        }
                                        response = {
                                            name: 'SUGGESTIONS',
                                            content: buttons
                                        };
                                        responses[0].queryResult.fulfillmentMessages[i] = response;
                                    }

                                }
                            }


                        } else {
                            if (fulfillment.platform === 'PLATFORM_UNSPECIFIED') {

                                if (isMulti) {
                                    response = {
                                        name: "multi",
                                        content: botText,
                                        mp3url: mp3url,
                                        imageUrl: imageUrl,
                                        pdfUrl: pdfUrl,
                                        videoUrl: videoUrl
                                    };
                                    isMulti = true;
                                    console.log("=== RETURNING PREMATURELY!!!");
                                    responses[0].queryResult.fulfillmentMessages[i] = response;
                                    // res.send(responses[0].queryResult.fulfillmentMessages[i]);
                                    // return;

                                } else {
                                    if (result.queryResult.fulfillmentMessages[i].text) {
                                        console.log("IDFKCKDKKFJD");
                                        console.log(botText);

                                        //console.log(result.queryResult.fulfillmentMessages[i].text.text);
                                        response = {
                                            name: 'DEFAULT',
                                            content: botText
                                        };
                                        responses[0].queryResult.fulfillmentMessages[i] = response;

                                    } else {
                                            if (result.queryResult.fulfillmentMessages[0].text) {
                                                response = {
                                                    name: 'DEFAULT',
                                                    content: result.queryResult.fulfillmentMessages[0].text.text[0]
                                                };
                                                //responses[0].queryResult.fulfillmentMessages[i] = response;
                                            } else {
                                                if (result.queryResult.fulfillmentMessages[0].simpleResponses) {
                                                    if (result.queryResult.fulfillmentMessages[0].simpleResponses.simpleResponses) {
                                                        console.log(result.queryResult.fulfillmentMessages[0].simpleResponses);
                                                        response = {
                                                            name: 'DEFAULT',
                                                            content: result.queryResult.fulfillmentMessages[0].simpleResponses.simpleResponses[0].textToSpeech
                                                        };
                                                        //responses[0].queryResult.fulfillmentMessages[i] = response;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            isMulti = false;
                        }


                    } else {
                    if (result.queryResult.fulfillmentMessages[0].text) {
                        response = {
                            name: 'DEFAULT',
                            content: result.queryResult.fulfillmentMessages[0].text.text[0]
                        };
                        responses[0].queryResult.fulfillmentMessages[0] = response;
                    }
                }
                    console.log("LENGTH BEFORE LOOP = " + result.queryResult.fulfillmentMessages.length);

                    let counter = [];


                    for (let x = 0; x < result.queryResult.fulfillmentMessages.length; x++) {
                        console.log(result.queryResult.fulfillmentMessages[x].name);
                        if (result.queryResult.fulfillmentMessages[x].name === 'multi') {
                            botReplyInMulti = true;
                            console.log(result.queryResult.fulfillmentMessages[x].name );
                            if (result.queryResult.fulfillmentMessages[x].name === undefined || typeof result.queryResult.fulfillmentMessages[x].name === 'undefined'  ) {

                                console.log("256 deleted " + x + " from array to return");
                                console.log(result.queryResult.fulfillmentMessages[x]);
                                counter.unshift(x);
                                continue;
                            }

                            if (result.queryResult.fulfillmentMessages[x].message === "payload") {
                                console.log(result.queryResult.fulfillmentMessages[x]);
                                console.log("MESSAGES[X].MESSAGE =  " + result.queryResult.fulfillmentMessages[x].message);
                                if (result.queryResult.fulfillmentMessages[x].message === "payload") {
                                    counter.unshift(x);
                                    //result.queryResult.fulfillmentMessages.splice(x, 1);
                                    continue;
                                }
                            }

                            if (result.queryResult.fulfillmentMessages[x].name === 'DEFAULT' && botReplyInMulti ) {
                                console.log("name === default && botReplyInMulti = true");
                                counter.unshift(x);
                            }

                            if (result.queryResult.fulfillmentMessages[x].text) {
                                if (result.queryResult.fulfillmentMessages[x].text.text[0] === botText) {
                                    counter.unshift(x);
                                    //result.queryResult.fulfillmentMessages.splice(x, 1);
                                    continue;
                                }
                            }
                        } else {
                            console.log("in else of ===undefined && !.suggestions");
                            if (result.queryResult.fulfillmentMessages[x].name === undefined || typeof result.queryResult.fulfillmentMessages[x].name === 'undefined'  ) {

                                console.log("256 deleted " + x + " from array to return");
                                console.log(result.queryResult.fulfillmentMessages[x]);
                                counter.unshift(x);
                                continue;
                            }
                            if (botReplyInMulti) {
                                if (result.queryResult.fulfillmentMessages[x].name === 'DEFAULT') {
                                    console.log("256 deleted " + x + " from array to return");
                                    console.log(result.queryResult.fulfillmentMessages[x]);
                                    counter.unshift(x);
                                }
                            }
                        }


                    }
                    console.log("counter.length = " + counter.length);
                    console.log(counter);
                    for (let y = 0; y < counter.length; y++) {
                        result.queryResult.fulfillmentMessages.splice(counter[y], 1);
                        console.log("deleted " + y);
                    }
                    console.log("LENGTH AFTER LOOP = " + result.queryResult.fulfillmentMessages.length);
                    console.log(result.queryResult.fulfillmentMessages[0]);
                    console.log(result.queryResult.fulfillmentMessages[1]);
                    console.log(result.queryResult.fulfillmentMessages[2]);
                    res.send(result);
            });
    } catch (e) {
        console.log("error =>");
        console.log(e);
        res.status(500).send("error");
    }
});

app.get('/healthcheck', (req, res) => {
    res.sendStatus(200);
});

let port = process.env.PORT || 5001;
app.listen(port, () => console.log(`App running on port ${port}`));
