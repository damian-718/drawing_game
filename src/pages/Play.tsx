import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

export default function Play() {

  const navigate = useNavigate();

    // const is a variable with constant reference, could be functions and states too, key to remember is REFERENCE. you cant set const handcreateroom to be a new function for example
    // const means you cant reassign the state or functions to something else
    // const for a variable means if its an array you can modify it but cant reassign, for a int or str those are immutable so you would need to create a new ocnst object
  const [roomName, setRoomName] = useState("");       // input value default to empty string
  const [rooms, setRooms] = useState<string[]>([]);   // list of created rooms default to empty list

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io("http://localhost:4000");
    socketRef.current = socket;
    // Request current active rooms
    socket.emit("getActiveRooms");

    // Listen for active rooms from server
    socket.on("activeRooms", (roomList: string[]) => {
      setRooms(roomList);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Create a new 
  // when typing in the input container, it registers keystrokes via onchange and sets roomname to the updated value. when button is clicked, onclick funciton is called and uses the roomname to update rooms list with this new roomname added
  const handleCreateRoom = () => {
    if (!roomName.trim() || !socketRef.current) return; // ignore empty names
  
    // Ensure socket is connected
    if (socketRef.current.connected) {
      socketRef.current.emit("createRoom", roomName.trim());
      setRoomName("");
    }
  };

  // Join a room (for now, just alert)
  const handleJoinRoom = (name: string) => {
    alert(`Joining room: ${name}`);
    navigate(`/canvas/${name}`); // dynamically navigates to clicked roomname page
  };

  return (
    <div style={styles.container}> 
      <h1 style={styles.title}>Play Page</h1>

      {/* Input + Create Room */}
      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
          style={styles.input}
        />
        <button onClick={handleCreateRoom} style={styles.createButton}>
          Create Room
        </button>
      </div>

      {/* List of rooms */}
      <div style={styles.roomsContainer}>
        {rooms.map((name, idx) => ( // .map loops over entire array/list and returns a new array of transformed valued, in this case create a button for each room with the onclick and name etc... idx is just current index so react can keep track of elements
            // React.createElement(MyMap, null, "Hello"), null is the default props a component accepts, then "Hello" is the children props, which in this case is the text for the button
          <button
            key={idx} // key helpes react keep track of which button refers which room, so if you delete a room it doesnt rerender everything and attach room to wrong buttons
            onClick={() => handleJoinRoom(name)}
            style={styles.roomButton}
          >
            {name}
          </button> // if i had my own custom button, I could pass in the {name} as a label and then that button component can render it as text instead
        ))}
      </div>
    </div>
  );
}

// Inline styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "24px",
  },
  inputContainer: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
  },
  input: {
    padding: "8px 12px",
    fontSize: "1rem",
  },
  createButton: {
    padding: "8px 16px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  roomsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "300px",
  },
  roomButton: {
    padding: "12px",
    fontSize: "1rem",
    cursor: "pointer",
    width: "100%",
  },
};