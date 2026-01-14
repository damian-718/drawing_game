import { Routes, Route } from "react-router-dom"; // for browser rendering
import Home from "./pages/Home";
import Play from "./pages/Play";
import Instructions from "./pages/Instructions";
import Canvas from "./pages/Canvas";

export default function App() {
  return (
    // routes is a component provided by router-dom to define route definitions
    // looks at current url to determine what to render, rooutes looks at each sub route component to see which matches
    // :roomName refers to a dynamic parameter placeholder in react
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play" element={<Play />} />
      <Route path="/instructions" element={<Instructions />} />
      <Route path="/canvas/:roomName" element={<Canvas />} /> 
    </Routes>
  );
}