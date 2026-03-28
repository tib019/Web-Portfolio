const express = require('express');
const WebSocket = require('ws');
const mariadb = require('mariadb');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'game_scores',
    connectionLimit: 5  
});

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        if (data.type === 'new_score') {
            try {
                await saveScore(data.username, data.score);
                const topScores = await getTopScores();
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'update_scores', scores: topScores }));
                    }
                });
            } catch (error) {
                console.error('Error handling message:', error);
            }
        }
    });
});

async function saveScore(username, score) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query("INSERT INTO scores (username, score) VALUES (?, ?)", [username, score]);
    } finally {
        if (conn) conn.end();
    }
}

async function getTopScores() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT username, score FROM scores ORDER BY score DESC LIMIT 10");
        return rows;
    } finally {
        if (conn) conn.end();
    }
}


server.listen(8080, () => {
    console.log('Server started on port 8080');
});
