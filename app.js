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

const dialogflow = require('dialogflow');
const sessionClientKor = new dialogflow.SessionsClient({ keyFilename: "kor/imc-axsbio-1b701901777b.json"});
const contextClientKor = new dialogflow.ContextsClient({ keyFilename: "kor/imc-axsbio-1b701901777b.json"});

app.get('/test', function(req, res) {
   res.send("Test received");
});

app.post('/kor/getBotResponse', async function(req, res) {
    console.log("getBotResponse ACTIVATED...");

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

    console.log("detecting Intent now...");
    try {
        sessionClientKor.detectIntent(request)
            .then(async responses => {
                let response = "";
                let responsesArray = [10];
                let result = responses[0];
                let mp3url = "";
                let imageUrl = "";
                let pdfUrl = "";
                let videoUrl = "";
                let userText = "";

                for (let i = 0; i < responses[0].queryResult.fulfillmentMessages.length; i++) {
                    let fulfillment = responses[0].queryResult.fulfillmentMessages[i];
                    if (fulfillment.payload) {
                        if (fulfillment.payload.fields) {
                            if (fulfillment.payload.fields.mp3url) {
                                mp3url = fulfillment.payload.fields.mp3url.stringValue;
                            }
                            if (fulfillment.payload.fields.imageUrl) {
                                imageUrl = fulfillment.payload.fields.imageUrl.stringValue;
                            }
                            if (fulfillment.payload.fields.pdfUrl) {
                                pdfUrl = fulfillment.payload.fields.pdfUrl.stringValue;
                            }
                            if (fulfillment.payload.fields.videoUrl) {
                                videoUrl = fulfillment.payload.fields.videoUrl.stringValue;
                            }
                        }
                    }
                }
                console.log("through 1st loop");

                if (responses[0].queryResult.fulfillmentMessages.length === 1) {
                    console.log("ffMessages length == 1");
                    if (mp3url !== "") {
                        response = {
                            name: 'DEFAULT',
                            content: result.queryResult.fulfillmentMessages[0].text.text[0],
                            mp3url: mp3url
                        };
                    } else if (imageUrl !== "") {
                        response = {
                            name: 'image',
                            content: result.queryResult.fulfillmentMessages[i].text.text[0],
                            imageUrl: imageUrl
                        };

                    } else if (pdfUrl !== "") {
                        response = {
                            name: 'pdf',
                            content: result.queryResult.fulfillmentMessages[i].text.text[0],
                            pdfUrl: pdfUrl
                        };
                    } else if (videoUrl !== "") {
                        response = {
                            name: 'video',
                            content: result.queryResult.fulfillmentMessages[i].text.text[0],
                            pdfUrl: videoUrl
                        };
                    } else {
                        console.log("no media present");
                        response = {
                            name: 'DEFAULT',
                            content: result.queryResult.fulfillmentMessages[0].text.text[0]
                        };
                    }
                    result.queryResult.fulfillmentMessages[0] = response;
                } else {
                    console.log("array > 1");
                    for (let i = 0; i < responses[0].queryResult.fulfillmentMessages.length; i++) {
                        let fulfillment = responses[0].queryResult.fulfillmentMessages[i];


                        if (fulfillment.platform === 'ACTIONS_ON_GOOGLE') {
                            if (fulfillment.simpleResponses) {
                                if (mp3url !== "") {
                                    response = {
                                        name: 'SIMPLE_RESPONSE',
                                        content: {
                                            textToSpeech: fulfillment.simpleResponses.simpleResponses[0].textToSpeech
                                        },
                                        mp3url: mp3url
                                    };
                                } else {
                                    response = {
                                        name: 'SIMPLE_RESPONSE',
                                        content: {
                                            textToSpeech: fulfillment.simpleResponses.simpleResponses[0].textToSpeech
                                        }
                                    };
                                }

                            } else {
                                if (fulfillment.suggestions) {
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
                                }
                            }
                        } else {
                            if (fulfillment.platform === 'PLATFORM_UNSPECIFIED') {
                                if (fulfillment.payload) {

                                } else {
                                    console.log("fulfillment.platform === UNSPECIFIED check data below");
                                    console.log(result.queryResult.fulfillmentMessages[i]);
                                    if (result.queryResult.fulfillmentMessages[i].text.text !== "") {
                                        console.log("mp3url filledIn = " + mp3url);
                                        console.log("imageurl filledIn = " + imageUrl);

                                        if (mp3url !== "") {
                                            response = {
                                                name: 'MP3',
                                                content: result.queryResult.fulfillmentMessages[i].text.text[0],
                                                mp3url: mp3url
                                            };
                                            mp3url = "";
                                        } else if (imageUrl !== "") {
                                            response = {
                                                name: 'image',
                                                content: result.queryResult.fulfillmentMessages[i].text.text[0],
                                                imageUrl: imageUrl
                                            };
                                            imageUrl = "";
                                        } else if (videoUrl !== "") {
                                            response = {
                                                name: 'video',
                                                content: result.queryResult.fulfillmentMessages[i].text.text[0],
                                                videoUrl: videoUrl
                                            };
                                            imageUrl = "";
                                        } else if (pdfUrl !== "") {
                                            response = {
                                                name: 'pdf',
                                                content: result.queryResult.fulfillmentMessages[i].text.text[0],
                                                pdfUrl: pdfUrl
                                            };
                                            pdfUrl = "";
                                        } else {
                                            if (result.queryResult.fulfillmentMessages[0].text) {
                                                response = {
                                                    name: 'DEFAULT',
                                                    content: result.queryResult.fulfillmentMessages[0].text.text[0]
                                                };
                                            } else {
                                                if (result.queryResult.fulfillmentMessages[0].simpleResponses) {
                                                    if (result.queryResult.fulfillmentMessages[0].simpleResponses.simpleResponses) {
                                                        console.log(result.queryResult.fulfillmentMessages[0].simpleResponses);
                                                        response = {
                                                            name: 'DEFAULT',
                                                            content: result.queryResult.fulfillmentMessages[0].simpleResponses.simpleResponses[0].textToSpeech
                                                        }
                                                    }
                                                }
                                                // console.log(">>>>>>> result.queryResult.fulfillmentMessages[0].text.text[0] IS EMPTY OR DOES NOT EXIST >>>>>>>>");
                                                // console.log(result.queryResult.fulfillmentMessages[0].simpleResponses.simpleResponses);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if (i > 0) {
                            if (result.queryResult.fulfillmentMessages[i] !== result.queryResult.fulfillmentMessages[i-1] && mp3url === "") {
                                result.queryResult.fulfillmentMessages[i] = response;
                                console.log("mp3url = " + mp3url);
                                console.log("returning response = " + i.toString());
                                console.log(response.name);
                                console.log(response.content);
                                response = "";
                            }
                        } else {
                            //response = "";
                            console.log("i !> 0");
                        }

                    }
                }
                //result.queryResult.fulfillmentMessages[0] = response;
                //console.log("sending back this shit: ");
                //console.log(result);
                // for (let x = 0; x < result.queryResult.fulfillmentMessages; x++) {
                //     console.log(result.queryResult.fulfillmentMessages[x]);
                // }
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
