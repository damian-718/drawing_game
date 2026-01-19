import express from "express";
import { createServer } from "http";
import { Server } from "socket.io"; // this socket.io server class lets us manage websocket connections, events, rooms, etc...

const app = express(); // lightweight http framework for node, this is so we have an app for socket.io to connect to
const httpServer = createServer(app); // wrap express app in a node.js http server

// Socket.IO server
const io = new Server(httpServer, {
  cors: { origin: "*" }, // allow all origins for local dev
});

type Line = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
  width?: number;
};

type ChatMessage = {
  userId: string;
  message: string;
  timestamp: number;
}

// Store drawings (line data)
const roomDrawings: Record<string, Line[]> = {};
// Store rooms
const rooms: Record<string, Set<string>> = {};  // a map where room(string) is the key and its values are the socketIds of people who connected(set of strings). set prevents dupes.
const activeRooms: Set<string> = new Set(); // just stores room names

// store chat messages
const chat: Record<string, String[]> = {};

// SOCKET.IO IS BUILT ON TOP OF A WEBSOCKET, IT CAN MANAGE ROOMS AUTOMATICALLY VIA SOCKET.JOIN and tracks all sockets which joined it
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id); // socket.io assigns unique ids to every connection

  socket.on("joinRoom", (roomName: string) => { // LISTENS TO A joinRoom EVENT SENT BY THE FRONTEND (socket.emit("joinRoom", roomName))
    socket.join(roomName); // socket.join is a socket.io built in feature, adds socket to a internal room. enables the socket.to(data.roomname).emit, so anyone in this room/group gets the emit
    if (!rooms[roomName]) rooms[roomName] = new Set(); // if room doesnt exist, initialize
    if (!chat[roomName]) chat[roomName] = []; // if chat doesnt exist, create it and initialize
    rooms[roomName].add(socket.id); // add to the values set for specific roomname key (dictionary)

    // send current drawing to new users
    socket.emit("initDrawing", roomDrawings[roomName] ?? []); // sends the line objects in this dict to users who loaded in  ?? refers to null ands defined instead of other falsly values like 0 or ""

    socket.emit("chatHistory", chat[roomName] ?? []); // sends chat history to users loading in

    console.log(`${socket.id} joined ${roomName}`);
  });

  socket.on("drawing", (data: { roomName: string; line: any }) => { // listens to a drawing event from the frontend/client. Payload has which room and the line data
    if (!roomDrawings[data.roomName]) {
      roomDrawings[data.roomName] = [];
    }
    roomDrawings[data.roomName].push(data.line);

    // Broadcast to everyone in the same room except sender
    socket.to(data.roomName).emit("drawing", data.line); // THIS IS WHAT SENDS THE DRAWING EVENT TO EVERYONE IN THE ROOM. socket.join() is socket.io internal room system, not to be confused with the rooms const dictionary. Socket.io manages its own internal rooms, when a socket.join(roomName) socket manages that room internally and broadcasts events to everyone in it.
  });

  socket.on("chatMessage", (data: { roomName: string; message: string }) => { // listens to a drawing event from the frontend/client. Payload has which room and the line data
    if (!chat[data.roomName]) {
      chat[data.roomName] = [];
    }
    chat[data.roomName].push(data.message); // store as history

    socket.to(data.roomName).emit("chatMessage", data.message); // Chat message emit to others in the room (socket.io ensures its sent to everyone but socket who emit it)
  });

  socket.on("clearCanvas", (data: { roomName: string }) => {
  // Broadcast to everyone in the same room except sender
    socket.to(data.roomName).emit("clearCanvas");
    // Reset the persisted drawing for this room
    if (roomDrawings[data.roomName]) {
      roomDrawings[data.roomName] = [];
    }
  });

  // Create room
  socket.on("createRoom", (roomName: string) => {
    if (!activeRooms.has(roomName)) {
      activeRooms.add(roomName);          // persist room name
    }
    if (!rooms[roomName]) {
      rooms[roomName] = new Set(); // track users in a room
    }
    rooms[roomName].add(socket.id);
    socket.join(roomName);
    // Broadcast updated room list to all clients
    io.emit("activeRooms", Array.from(activeRooms));
  });

  // Send active rooms on request
  socket.on("getActiveRooms", () => {
    socket.emit("activeRooms", Array.from(activeRooms));
  });

  // { }) lets you run multiple things inside the arrow fucntions, with just => its one function. block body vs concise body.
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    // Remove user from rooms
    Object.keys(rooms).forEach((roomName) => {
      rooms[roomName].delete(socket.id); // when socket (user) diconnectes, remove from all rooms they were in

    // If room is now empty, delete it
      if (rooms[roomName].size === 0) {
        delete rooms[roomName];           // remove from rooms map
        delete roomDrawings[roomName];    // also clear persisted drawings
        delete chat[roomName]; // clear chat history
        //activeRooms.delete(roomName);     // remove from active rooms
        console.log(`Room ${roomName} deleted (empty)`);
      }
    });
  });

});
// 4000 is just the port backend listens on, frontend connects to this when canvas is loaded
httpServer.listen(4000, () => console.log("Socket.IO server running on :4000"));

// node.js runs server.ts and hosts a server on my machine (localhost). node can run continously, handle many connections, and work with socket.io. react emits drawing events via socket.io, node(server) recieves events and broadcast to other clients again via socket.io.
// express and socket.io are used on top of node. socket handles the websocket connections, express handle http routing