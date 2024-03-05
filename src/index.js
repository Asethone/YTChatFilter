const express = require('express');
const { readFile } = require('fs');
const { WebSocketServer } = require('ws');

// Data
const msgSet = new Set();       // Set of all messages which were recieved so far to handle duplicates
const authorsSet = new Set();   // Set of all authors which messages were submitted by pressing on '✅' button
const activeMsgs = new Map();   // Map of currently active messages with id-s as keys

let msgId = 1;                     // An unique message identifier

// HTTP server
const app = express();

app.use(express.static('res'));
app.use(express.json());

app.get('/', (req, res) => {
    readFile('res/view.html', 'utf8', (err, html) => {
        if (err) {
            res.status(500).send();
        }

        res.send(html);
    });
});

app.post('/', (req, res) => {
    const data = req.body;
    console.log('[HTTP] Recieved: \n%s', data);

    if (data.allowDuplicates === false && msgSet.has(data.message)) {
        res.status(202).send();
        return;
    }

    data.id = msgId++;
    activeMsgs.set(data.id, data);
    msgSet.add(data.message);
    sendDataToView(0, data);    // send message to view
    res.status(200).send();
});

// for local testing
app.options('/', (req, res) => {
    // send responce to CORR
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');

    res.status(200).send();
});

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});

// WebSocket server
const wss = new WebSocketServer({ port: 3001 });
var ws = null;

wss.on('connection', (websocket) => {
    ws = websocket;
    console.log('[WebSocket] View connected');

    // send every active message to view
    for (entry of activeMsgs) {
        sendDataToView(0, entry[1]);
    }

    ws.on('message', (rawData) => {
        console.log('[WebSocket] Recieved: \n%s', rawData);
        const data = JSON.parse(rawData);
        switch (data.type) {
            case 1:             // view requires authors
                sendDataToView(1, Array.from(authorsSet));  // send authors array
                break;
            case 2:             // view discards message with saving author
                // data.data = id
                authorsSet.add(activeMsgs.get(data.data).author);
            case 3:             // view discards message without saving
                // data.data = id
                activeMsgs.delete(data.data);
                break;
            default:
                break;
        }
    });

    // TODO: seems that it causes a bug with separate views.
    ws.on('close', (reason) => {
        ws = null;
        console.log('[WebSocket] View closed. Reason: %s', reason);
    });
});

function sendDataToView(type, data) {
    if (ws) {
        ws.send(JSON.stringify({
            type: type,
            data: data
        }));
    }
}

// TODO:
// - fix bug above
