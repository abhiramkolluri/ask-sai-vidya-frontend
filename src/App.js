import "./App.css";
import Login from "./components/login/Login";
import React from "react"
import Chatpage from "./pages/chatpage/Chatpage";
import { Routes, Switch, Route, Link, Router } from "react-router-dom";
import Signin from "./pages/signin/Signin";
import Welcome from "./pages/welcome/Welcome";
import Reset from "./pages/password/reset/Reset";
import NewPassword from "./pages/password/reset/NewPassword";
import Blog from "./pages/blog/Blog";

function App() {
  return (
    <div className="App">
      {/* <Chatpage /> */}

      <Routes>
        <Route path="/" element={<Chatpage />} />
        <Route path="/signin" element={<Signin showLogin={true} />} />
        <Route path="/signup" element={<Signin showLogin={false} />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/password/reset" element={<Reset />} />
        <Route path="/password/newpassword" element={<NewPassword />} />
      </Routes>
    </div>
  );
}

export default App;
