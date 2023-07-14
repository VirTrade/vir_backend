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
            if(!socket) {
                console.log("In if Socket")
                socket = new WebSocket('ws://smartapisocket.angelone.in/smart-stream', {
                    headers: {
                        'Authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IlAzMzQ0NjAiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwiaWF0IjoxNjg5MzE5MzQ5LCJleHAiOjE2ODk0MDU3NDl9.iWqXPMsN1bLN99MJfDTluVQ33lRpJFO1s9S1PSCqvRE-ct9qwqdzII3hu-RrvpcLZoyF3cXbwHa2GCf1Fs_pow',
                        'x-api-key': 'AGRYNg5p',
                        'x-client-code': 'P334460',
                        'x-feed-token': 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IlAzMzQ0NjAiLCJpYXQiOjE2ODkzMTkzNDksImV4cCI6MTY4OTQwNTc0OX0.lz3xI_46LXb7WNW-6C5w-fD-C88BH6bgdI6OQmajmN1rT9P3n0pVcZPeEf2kzhyOXquKsNBldhwelCEQwDcW-g',
                    },
                });
            }

            socket.on('open', () => {
                console.log('WebSocket connection established');

                // Send a subscribe request for LTP mode with the desired token
                let json_req = {                    
                    action: 1,
                    params: {
                        mode: 1,
                        tokenList: [
                            {
                                exchangeType: 1,
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