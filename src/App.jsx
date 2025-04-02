import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import PartOne from "./pages/PartOne";
import PartTwo from "./pages/PartTwo";
import NavigationBar from "./components/NavigationBar";
import React from "react";

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen">
        <NavigationBar />
        <div className="flex-grow p-4">
          <Routes>
            <Route path="/" element={<PartOne />} />
            <Route path="/part-one" element={<PartOne />} />
            <Route path="/part-two" element={<PartTwo />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
