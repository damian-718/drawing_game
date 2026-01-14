import express from "express";
import { createServer } from "http";
import { Server } from "socket.io"; // this socket.io server class lets us manage websocket connections, events, rooms, etc...

const app = express(); // lightweight http framework for node, this is so we have an app for socket.io to connect to
const httpServer = createServer(app); // wrap express app in a node.js http server

// Socket.IO server
const io = new Server(httpServer, {
  cors: { origin: "*" }, // allow all origins for local dev
});

// Store rooms
const rooms: Record<string, Set<string>> = {};  // a map where room(string) is the key and its values are the socketIds of people who connected(set of strings). set prevents dupes.

// SOCKET.IO IS BUILT ON TOP OF A WEBSOCKET, IT CAN MANAGE ROOMS AUTOMATICALLY VIA SOCKET.JOIN and tracks all sockets which joined it
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id); // socket.io assigns unique ids to every connection

  socket.on("joinRoom", (roomName: string) => { // LISTENS TO A joinRoom EVENT SENT BY THE FRONTEND (socket.emit("joinRoom", roomName))
    socket.join(roomName); // socket.join is a socket.io built in feature, adds socket to a internal room. enables the socket.to(data.roomname).emit, so anyone in this room/group gets the emit
    if (!rooms[roomName]) rooms[roomName] = new Set(); // if room doesnt exist, create it and initialize
    rooms[roomName].add(socket.id); // add to the values set for specific roomname key (dictionary)
    console.log(`${socket.id} joined ${roomName}`);
  });

  socket.on("drawing", (data: { roomName: string; line: any }) => { // listens to a drawing event from the frontend/client. Payload has which room and the line data
    // Broadcast to everyone in the same room except sender
    socket.to(data.roomName).emit("drawing", data.line); // THIS IS WHAT SENDS THE DRAWING EVENT TO EVERYONE IN THE ROOM. socket.join() is socket.io internal room system, not to be confused with the rooms const dictionary. Socket.io manages its own internal rooms, when a socket.join(roomName) socket manages that room internally and broadcasts events to everyone in it.
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    // Remove user from rooms
    Object.keys(rooms).forEach((room) => rooms[room].delete(socket.id)); // when socket (user) diconnectes, remove from all rooms they were in
  });
});
// 4000 is just the port backend listens on, frontend connects to this when canvas is loaded
httpServer.listen(4000, () => console.log("Socket.IO server running on :4000"));

// node.js runs server.ts and hosts a server on my machine (localhost). node can run continously, handle many connections, and work with socket.io. react emits drawing events via socket.io, node(server) recieves events and broadcast to other clients again via socket.io.
// express and socket.io are used on top of node. socket handles the websocket connections, express handle http routing