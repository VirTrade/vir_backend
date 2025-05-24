const express = require("express");
const app = express();
const cors = require("cors");
const WebSocket = require("ws");
const server = require("http").createServer(app);

// 🚨 Open CORS - use only for dev/testing
app.use(cors({
  origin: "*", // ✅ allow all origins
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: false, // ⚠️ Must be false if origin is "*"
}));

const socketIO = require("socket.io")(server, {
  cors: {
    origin: "*", // ✅ allow all origins
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: false, // ⚠️ Must be false if origin is "*"
  },
});

const userSockets = {}; // key = userId/clientCode, value = socket
let socketSet = new Set();
let userSet = new Set();

socketIO.on("connection", (socket) => {
  console.log("Socket connected with userSet", userSet);
  let counter = 0;
  let userId = counter + 1;
  userSet.add(userId);
  socketSet.add(socket);

  const feedToken = socket.handshake.auth.feedToken;
  const apiKey = socket.handshake.auth.apiKey;
  const clientCode = socket.handshake.auth.clientCode;

  console.log("Feed token:", feedToken);
  console.log("Jwt token:", apiKey);
  console.log("Refresh token:", clientCode);

  socket.emit("userId", userId);

  socket.on("sendData", (data) => {
    console.log("data", data);
    handleUserConnection(clientCode, apiKey, feedToken, data, socket);
  });

  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected`);
    socketSet.delete(socket);
    userSet.delete(userId);
  });
});

app.get("/stocks", async (req, res) => {
  try {
    const response = await fetch("https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json");
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

function handleUserConnection(clientCode, apiKey, feedToken, data, socket) {
  console.log("Data received", data);
  if (userSockets[clientCode] && userSockets[clientCode].readyState === WebSocket.OPEN) {
    console.log("Reusing existing socket for", clientCode);
    subscribeToTokens(userSockets[clientCode], data);
    return;
  }

  const sock = new WebSocket("wss://smartapisocket.angelone.in/smart-stream", {
    headers: {
      "Authorization": feedToken,
      "x-api-key": apiKey,
      "x-client-code": clientCode,
      "x-feed-token": feedToken,
    },
  });

  userSockets[clientCode] = sock;

  sock.on("open", () => {
    console.log("Socket Connected");
    subscribeToTokens(sock, data);
  });

  sock.on("message", (data) => {
    try {
      console.log("Received Message", data);
      socket.broadcast.emit("liveFeed", data);
    } catch (e) {
      console.log("Exception e", e);
    }
  });

  sock.on("close", (code, reason) => {
    console.log("WebSocket connection closed:", code, reason);
    delete userSockets[clientCode];
  });

  sock.on("error", (error) => {
    console.error("WebSocket connection error:", error);
    delete userSockets[clientCode];
  });
}

function subscribeToTokens(sock, data) {
  const json_req = {
    action: 1,
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
  console.log("json_req", json_req);
  sock.send(JSON.stringify(json_req));
}

server.listen(5000, () => console.log("Listening on Server 5000"));
