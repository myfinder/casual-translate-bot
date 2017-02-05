"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

// My definitions
var util = require('util');
var request = require('request');

bot.dialog('/', function (session) {
    if (session.message.text.match(/^\\en/)) {
        session.message.text = session.message.text.replace(/^\\en/,'');
    }
    else {
        return;
    }
    
    var apiKey = process.env['OCP_APIM_SUB_KEY'];

    request.post({
    	url: 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken',
        headers: {
            'Ocp-Apim-Subscription-Key' : apiKey
        }
    }, function (err, resp, body) {
            request.get({
                url: 'https://api.microsofttranslator.com/v2/http.svc/Translate?appid=Bearer%20' + body + '&to=en&category=generalnn&text=' + encodeURIComponent(session.message.text), 
                headers: {
                    'Accept' : 'application/xml'
                }
            }, function (err, resp, body) {
                var response = body.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,'');
                session.send('それ英語でいうと ' + response + ' です。 #general にも投稿してみては!');
            });
        }
    );
});

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
