const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});
let socketReadyPromise = null
const WebSocket = require("ws");
const server = require("http").createServer(app);
const ws = require("ws");
const e = require("express");
const socketIO = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST","PUT","PATCH","DELETE"],
  },
});

let sock;

let socketSet = new Set();
let userSet = new Set();
socketIO.on("connection", (socket) => {
  console.log("Socket connected with userSet", userSet);
  let counter = 0;
  let userId = counter + 1;
  userSet.add(userId);
  console.log(`User ${userId} connected`);
  socketSet.add(socket);
  
  socket.emit('userId', userId);
  socket.on("sendData", async (data) => {
    const headers = socket.handshake.headers    
    if(!socketReadyPromise) {
      socketReadyPromise = new Promise((resolve) => {
        // try {
          sock = new WebSocket("ws://smartapisocket.angelone.in/smart-stream", {
            headers: {
              "Authorization": headers.authorization,
              "x-api-key": headers.apikey,
              "x-client-code": headers.clientcode,
              "x-feed-token": headers.feedtoken,
            },
          });
    
          sock.on("open", () => {        
            resolve()
            // sock.send(JSON.stringify(json_req));
          });                        
      })
      await socketReadyPromise

      let json_req = {
        action: 0,
        params: {
          mode: 1,
          tokenList: [
            {
              exchangeType: 5,
              tokens: JSON.parse(data),
            },
          ],
        },
      };
      sock.send(JSON.stringify(json_req));

      sock.on("message", (data) => {
        console.log("Received message:", data);    
          try {
            console.log("userset",userSet)
            socket.broadcast.emit("liveFeed",data)
            console.log("userset",userSet)
          }    
          catch(e)  {
            console.log("Exception e",e)
          }        
      });
      
      sock.on("close", (code, reason) => {
        console.log("WebSocket connection closed:", code, reason);        
      });
      
      sock.on("error", (error) => {
        console.error("WebSocket connection error:", error);
      });

      setInterval(() => {
        socket.send("ping");
      }, 30000);
    }
  });
  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected`);
    socketSet.delete(socket);
    userSet.delete(userId);
  });
});

server.listen(5000, () => console.log("Listening on Server 5000"));
