import { Server } from "socket.io";
import express, { request, response } from "express";
import type { Express } from "express";
import { createServer } from "http";
import { dirname, join } from "path";
import type * as q from "./quizinterface.ts";

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log("a user connected");
});

httpServer.listen(3001, () => {
    console.log("listening on *:3001");
});

