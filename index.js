const express = require('express');
const app = express();
const server = require('http').createServer(app);
const ws = require('ws')
let socket;

const wss = new ws.Server({ server: server })

wss.on("connection", (ws) => {

    const WebSocket = require('ws');

    ws.on("message", (message) => {
        const receivedBuffer = Buffer.from(message);
        const receivedData = JSON.parse(receivedBuffer);
        console.log("receivedData", receivedData);
        // Create a WebSocket instance with the desired URL and headers
        try {        
            socket = new WebSocket('ws://smartapisocket.angelone.in/smart-stream', {
                headers: {
                    'Authorization': process.env.jwt,
                    'x-api-key': process.env.api-key,
                    'x-client-code': process.env.client-code,
                    'x-feed-token': process.env.feed-token,
                },
            }); 

            socket.on('open', () => {
                console.log('WebSocket connection established');

                // Send a subscribe request for LTP mode with the desired token
                let json_req = {                    
                    action: 0,
                    params: {
                        mode: 1,
                        tokenList: [
                            {
                                exchangeType: 5,
                                tokens: receivedData,
                            },
                        ],
                    },
                };
                socket.send(JSON.stringify(json_req));
            });

            // Event listener for receiving messages            

            socket.on('message', (data) => {
                console.log('Received message:', data);
                ws.send(data)
            });

            // Event listener for connection close
            socket.on('close', (code, reason) => {
                console.log('WebSocket connection closed:', code, reason);
            });

            // Event listener for connection errors
            socket.on('error', (error) => {
                console.error('WebSocket connection error:', error);
            });

            setInterval(() => {
                socket.send('ping')
            }, 30000)
        }
        catch (e) {
            console.log(e)
        }
        // ws.send("Received Credentials")
    })
})

server.listen(5000, () => console.log("Listening on Server 5000"))