const express = require('express');
const { readFile } = require('fs');
const { WebSocketServer } = require('ws');

// Data
const msgSet = new Set();       // Set of all messages which were recieved so far to handle duplicates
const authorsSet = new Set();   // Set of all authors which messages were submitted by pressing on '✅' button
const msgQueue = [];            // Array of currently active messages

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

    msgSet.add(data.message);
    sendMessageToView(data);
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

    ws.on('message', (rawData) => {
        console.log('[WebSocket] Recieved: \n%s', rawData);
        const data = JSON.parse(rawData);
        switch (data.type) {
            case 1:             // view requires authors
                ws.send(JSON.stringify({
                    type: 1,    // authors array
                    data: Array.from(authorsSet)
                }));
                break;
            case 2:             // view sends author to save
                authorsSet.add(data.data);
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

function sendMessageToView(data) {
    if (ws) {
        ws.send(JSON.stringify({
            type: 0,    // message object
            data: data
        }));
    }
}

// TODO:
// - fill msgQueue
// - fix bug above
