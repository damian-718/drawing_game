import { useParams } from "react-router-dom";
import { useRef, useEffect, useState } from "react"; // use ref gives us a reference to a DOM element (canvas) so we can draw. dom element is component rendered on the screen
import { io, Socket } from "socket.io-client";

export default function Canvas() {
  // Canvas is dynammic, it goes to the page a user selected as a room. So useParams is able to grab the specific route clicked on for canvas. canvas/:roomname, useparams gets the current path
  const { roomName } = useParams<{ roomName: string }>(); // typescript is saying roomName is a string
  const canvasRef = useRef<HTMLCanvasElement>(null); // create the reference to the canvas element, null since it doesnt exist untill rendered
  const [isDrawing, setIsDrawing] = useState(false); // if drawing then track mouse position, default false
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null); // track mouse position when drawing, default null. lastpos since we draw from last pos to new pos of mouse  

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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    setIsDrawing(true);
    setLastPos(getMousePos(e));
  };
  // need to split up draw function. This is because if we put socket.emit here, we cant use this function to also listen (socket.on) or else it breaks.
  const draw = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d"); // ? means only call getcontext if not null, we want to give react time to render canvas so it could be null at first. getcontext("2d") returns 2d drawing context which allows gives methods like draw shapes, lines, text, etc...
    if (!ctx || !lastPos) return;

    const { x, y } = getMousePos(e);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPos(null);
  };
   
  // when we say a component mounted, its when the component loads, so in this case someone in the play url clicks a room, now it takes us to canvas and canvas "mounts"
  // component rerenders on state changes
  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h1>Room: {roomName}</h1>
      <canvas // this is the canvas component, inside is the mouse events so they only work inside this container
        ref={canvasRef} // react automatically sets the canvasref when it loads, default null but once mounted its not null automatically
        width={800}
        height={600}
        style={{ border: "1px solid black", cursor: "crosshair" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <p>Draw with your mouse!</p>
    </div>
  );
}
