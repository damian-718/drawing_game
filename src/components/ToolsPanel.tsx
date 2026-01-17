import React from "react";


// interface is typescript, so when props are passed, it will check the props against the types in here
interface ToolsPanelProps {
  penColor: string;
  setPenColor: (color: string) => void;
  penSize: number;
  setPenSize: (size: number) => void;
  eraserMode: boolean;
  setEraserMode: (mode: boolean) => void;
}
// color panel
const commonColors = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];

export default function ToolsPanel({
  penColor,
  setPenColor,
  penSize,
  setPenSize,
  eraserMode,
  setEraserMode,
}: ToolsPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <h3>Tools</h3>

      <div >
        {commonColors.map((color) => (
          <button
            key={color}
            onClick={() => setPenColor(color)} // tools can now call the states from canvas
            style={{
              backgroundColor: color,
              width: "24px",
              height: "24px",
              border: penColor === color ? "2px solid black" : "1px solid gray",
              cursor: "pointer",
            }}
          />
        ))}
      </div>  

      <label>
        Color:
        <input
          type="color"
          value={penColor}
          onChange={(e) => setPenColor(e.target.value)}
        />
      </label>

      <label>
        Size:
        <input
          type="range"
          min={1}
          max={20}
          value={penSize}
          onChange={(e) => setPenSize(parseInt(e.target.value))}
        />
      </label>

      <button onClick={() => setEraserMode(!eraserMode)}>
        {eraserMode ? "Eraser On" : "Eraser Off"}
      </button>
    </div>
  );
}