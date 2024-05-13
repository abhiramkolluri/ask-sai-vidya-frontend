import "./App.css";
import Login from "./components/login/Login";
import Chatpage from "./pages/chatpage/Chatpage";
import { Routes, Switch, Route, Link, Router } from "react-router-dom";
import Signin from "./pages/signin/Signin";

function App() {
  return (
    <div className="App">
      {/* <Chatpage /> */}

      <Routes>
        <Route path="/" element={<Chatpage />} />
        <Route path="/login" element={<Signin />} />
      </Routes>
    </div>
  );
}

export default App;
