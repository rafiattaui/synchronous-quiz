import { Server } from "socket.io";
import express from "express";
import type { Express } from "express";
import { createServer } from "http";
import { initSocketHandlers } from "./server.ts";
import { initQuizState } from "./httpfunctions.ts";

const app: Express = express();
const router = app.router;
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

initSocketHandlers(io);

httpServer.listen(3001, () => {
    console.log("Server is listening on port 3001");
})

router.get('/init', (req, res) => {
    initQuizState(req, res);
})




