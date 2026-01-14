import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

// Socket.IO server
const io = new Server(httpServer, {
  cors: { origin: "*" }, // allow all origins for local dev
});

// Store rooms
const rooms: Record<string, Set<string>> = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", (roomName: string) => {
    socket.join(roomName);
    if (!rooms[roomName]) rooms[roomName] = new Set();
    rooms[roomName].add(socket.id);
    console.log(`${socket.id} joined ${roomName}`);
  });

  socket.on("drawing", (data: { roomName: string; line: any }) => {
    // Broadcast to everyone in the same room except sender
    socket.to(data.roomName).emit("drawing", data.line);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    // Remove user from rooms
    Object.keys(rooms).forEach((room) => rooms[room].delete(socket.id));
  });
});

httpServer.listen(4000, () => console.log("Socket.IO server running on :4000"));