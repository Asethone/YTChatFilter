const express = require('express');
const { readFile } = require('fs');
const { WebSocketServer } = require('ws');

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
    console.log('[HTTP] recieved: \n%s', data);
    console.log('data.message: ', data.message);
    if (ws) {
        ws.send(JSON.stringify(data));
    }
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
    console.log('View connected');

    ws.on('message', (data) => {
        console.log('[WebSocket] recieved: \n%s', data);
    });

    ws.on('close', (reason) => {
        ws = null;
        console.log('View closed. reason: %s', reason);
    });
});

// TODO:
// - two buttons in view

// NOTES:
// + filtering must be done here, because of Set!
