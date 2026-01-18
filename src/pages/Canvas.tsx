import { useParams } from "react-router-dom";
import { useRef, useEffect, useState } from "react"; // use ref gives us a reference to a DOM element (canvas) so we can draw. dom element is component rendered on the screen
import { io, Socket } from "socket.io-client";
import ToolsPanel from "../components/ToolsPanel";
import ChatPanel from "../components/ChatPanel";

export default function Canvas() {
  // Canvas is dynammic, it goes to the page a user selected as a room. So useParams is able to grab the specific route clicked on for canvas. canvas/:roomname, useparams gets the current path
  const { roomName } = useParams<{ roomName: string }>(); // typescript is saying roomName is a string
  const canvasRef = useRef<HTMLCanvasElement>(null); // create the reference to the canvas element, null since it doesnt exist untill rendered
  const [isDrawing, setIsDrawing] = useState(false); // if drawing then track mouse position, default false
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null); // track mouse position when drawing, default null. lastpos since we draw from last pos to new pos of mouse
  const socketRef = useRef<Socket | null>(null); // useref is a reference to elements to be used elsewhere in the code

  // Tools state
  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(2);
  const [eraserMode, setEraserMode] = useState(false);

  const [socketConnected, setSocketConnected] = useState(false);

   // Connect to server. useeffect runs ONCE on mount or room change, but the socket stays active whole time, the useeffect sets up the socket
  useEffect(() => { // this is a side effect triggered when component mounts or roomname changes
    const socket = io("http://localhost:4000"); // sends to node.js backend server
    socketRef.current = socket; // store current socket instance
    // emit sends activity, on recieves

    socket.on("connect", () => {
      setSocketConnected(true); // triggers re-render
      socket.emit("joinRoom", roomName!);
    });
    //socket.emit("joinRoom", roomName!); // tells backend server to put me in this room so i only listen to events in this room
    
    // **this line is why we split up the draw into drawline and handlemousemove. If we listen with socket.on, the previous draw would need to have socket.emit inside it which results in a cycle. on trtggers emit, emit triggers on...
    socket.on("drawing", (line) => { //listenes to drawing events and draws those events on recieveing clients canvas
      const ctx = canvasRef.current?.getContext("2d"); // gets the drawable board to draw the line emitted, only users in the room as per backend socket.io. No need to track room here since drawing events only emitted by the backend to users in the same room.
      if (!ctx) return;
      drawLine(ctx, line.from, line.to, line.color, line.size, line.isErasor);    
    });

    socket.on("initDrawing", (lines) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      (lines ?? []).forEach((line: any) => {
        drawLine(ctx, line.from, line.to, line.color, line.size, line.isErasor);
      });
    });

    // Listen for clear events
    socket.on("clearCanvas", () => {
      const ctx = canvasRef.current?.getContext("2d");
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomName]); // this is how it knows to run the effect not only on mount but also when roomname changes. So roomname comes from the params which is dynamic url. so user joins a different room, the param is different etc..
      // lets say you have user1 in canvas/test1. they use a sidebar and go canvas/test2 without reloading canvas. Thats why we need this. it will create new socket connection and disconnect previous.

  // Helper to get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 }; // if canvas hasnt rendered, dont do anything
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left, // we do - rect.left and rect.right so top left of canvas is 0,0. we treat canvas like its own grid
      y: e.clientY - rect.top,
    };
  };

  const drawLine = (
    // these are typescripts types this functions accepts
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: string,
    size: number,
    isEraser?: boolean
  ) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out"; // true erasing
      ctx.strokeStyle = "rgba(0,0,0,1)"; // color doesn't matter
    } else {
      ctx.globalCompositeOperation = "source-over"; // normal drawing
      ctx.strokeStyle = color;
    }
    ctx.stroke();
  };

//   const startDrawing = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
//     setIsDrawing(true);
//     setLastPos(getMousePos(e));
//   };

  // this is for when the client themselves draws, now drawLine is seperated so the socket.on can draw what it recieves, and client can draw independantly.
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!isDrawing || !lastPos || !socketRef.current) return;
    const currentPos = getMousePos(e)!;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    drawLine(ctx, lastPos, currentPos, penColor, penSize, eraserMode);

    // Emit line to server
    socketRef.current.emit("drawing", {
      roomName,
      line: { from: lastPos, to: currentPos, color: penColor, size: penSize, isErasor: eraserMode },
    });

    setLastPos(currentPos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return; 
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    // Clear the entire canvas area
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Emit a "clearCanvas" event to the room via socket
    if (socketRef.current) {
      socketRef.current.emit("clearCanvas", { roomName });
    }
  };
  
  // when we say a component mounted, its when the component loads, so in this case someone in the play url clicks a room, now it takes us to canvas and canvas "mounts"
  // component rerenders on state changes
  // flexbox allows us to change layout of components, display : flex means side by side
  return (
    <div style={{ display: "flex", height: "600px", gap: "20px", padding: "20px" }}> 
      <h1>Room: {roomName}</h1>
      <div style={{ flex: 3 }}>
        <canvas // this is the canvas component, inside is the mouse events so they only work inside this container
          ref={canvasRef} // react automatically sets the canvasref when it loads, default null but once mounted its not null automatically
          width={800}
          height={600}
          style={{ border: "1px solid black", cursor: "crosshair" }}
          onMouseDown={(e) => {
            setIsDrawing(true);
            setLastPos(getMousePos(e));
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={() => setIsDrawing(false)}
        />
        <ToolsPanel
          penColor={penColor}
          setPenColor={setPenColor}
          penSize={penSize}
          setPenSize={setPenSize}
          eraserMode={eraserMode}
          setEraserMode={setEraserMode}
          onClear ={clearCanvas}
        />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" }}>
        {socketRef.current && roomName && (
          <ChatPanel socket={socketRef.current} roomName={roomName} />
        )}
      </div>
    </div>
  );
}