var express = require('express.io')
var uuid = require('uuid');
var EventHubClient = require('azure-event-hubs').Client;
var IotHubClient = require('azure-iothub').Client;
var Message = require('azure-iot-common').Message;

app = express().http().io()

var iotHubConnectionString = process.env.IOT_IOTHUB_CONNSTRING || ''
var eventHubConnectionString = process.env.IOT_EVENTHUB_CONNSTRING || ''
var eventHubName = process.env.IOT_EVENTHUBNAME || 'ioteventhub'
var client = EventHubClient.fromConnectionString(eventHubConnectionString, eventHubName)

// Setup your sessions, just like normal.
app.use(express.cookieParser())
app.use(express.session({secret: 'iotdashboard'}))

// Session is automatically setup on initial request.
app.get('/', function(req, res) {
    req.session.loginDate = new Date().toString()
    res.sendfile(__dirname + '/index.html')
});

app.use(express.static(__dirname + '/static'));

// Instantiate an eventhub client

app.io.route('ready', function(req) {
    // For each partition, register a callback function
    client.getPartitionIds().then(function(ids) {
        ids.forEach(function(id) {
            var minutesAgo = 5;
            var before = (minutesAgo*60*1000);
            client.createReceiver('$Default', id, { startAfterTime: Date.now() - before })
                .then(function(rx) {
                    rx.on('errorReceived', function(err) { console.log(err); });
                    rx.on('message', function(message) {
                        console.log(message.body);
                        var body = message.body;
                        try {
                            app.io.broadcast('data', body);
                        } catch (err) {
                            console.log("Error sending: " + body);
                            console.log(typeof(body));
                        }
                    });
                });
        });
    });
});

app.listen(process.env.port || 7076)