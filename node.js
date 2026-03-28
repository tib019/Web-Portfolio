const express = require('express');
const WebSocket = require('ws');
const mysql = require('mysql');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'game_scores'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.action === 'submit_score') {
            const { username, score } = data;
            const query = 'INSERT INTO scores (username, score) VALUES (?, ?)';
            db.query(query, [username, score], (err, result) => {
                if (err) throw err;
                sendLeaderboard();
            });
        }
    });

    function sendLeaderboard() {
        const query = 'SELECT username, score FROM scores ORDER BY score DESC LIMIT 10';
        db.query(query, (err, results) => {
            if (err) throw err;
            ws.send(JSON.stringify({ action: 'update_leaderboard', leaderboard: results }));
        });
    }

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});


server.listen(8080, () => {
    console.log('Server listening on port 8080');
});
