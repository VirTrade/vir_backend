const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});
const WebSocket = require("ws");
const server = require("http").createServer(app);
const ws = require("ws");
const socketIO = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let sock;

// const wss = new ws.Server({ server: server })
// const io = socketIO(server);

socketIO.on("connection", (socket) => {
  console.log("Socket connected");
  socket.on("sendData", (data) => {
    console.log("Received data from frontend:", data);
    console.log(socket.handshake.headers)
    const headers = socket.handshake.headers

    // Create a WebSocket instance with the desired URL and headers
    try {
      sock = new WebSocket("ws://smartapisocket.angelone.in/smart-stream", {
        headers: {
          "Authorization": headers.authorization,
          "x-api-key": headers.apikey,
          "x-client-code": headers.clientcode,
          "x-feed-token": headers.feedtoken,
        },
      });

      sock.on("open", () => {
        console.log("WebSocket connection established");

        // Send a subscribe request for LTP mode with the desired token
        let json_req = {
          action: 0,
          params: {
            mode: 1,
            tokenList: [
              {
                exchangeType: 5,
                tokens: data,
              },
            ],
          },
        };
        sock.send(JSON.stringify(json_req));
      });

      // Event listener for receiving messages

      sock.on("message", (data) => {
        console.log("Received message:", data);
        ws.send(data);
      });

      // Event listener for connection close
      sock.on("close", (code, reason) => {
        console.log("WebSocket connection closed:", code, reason);
      });

      // Event listener for connection errors
      sock.on("error", (error) => {
        console.error("WebSocket connection error:", error);
      });

      setInterval(() => {
        socket.send("ping");
      }, 30000);
    } catch (e) {
      console.log(e);
    }
    // ws.send("Received Credentials")

    socket.emit("response", { message: "Data received" });
  });
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(5000, () => console.log("Listening on Server 5000"));
