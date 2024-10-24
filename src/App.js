import React from "react";
import { Routes, Switch, Route, Link, Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import Chatpage from "./pages/chatpage/Chatpage";
import "./App.css";
import Login from "./components/login/Login";
import Signin from "./pages/signin/Signin";
import Welcome from "./pages/welcome/Welcome";
import Reset from "./pages/password/reset/Reset";
import NewPassword from "./pages/password/reset/NewPassword";
import Blog from "./pages/blog/Blog";
import ErrorPage from "./components/error/ErrorPage";

const queryClient = new QueryClient();

function App() {
  return (
    <div className="App">
      {/* <Chatpage /> */}

      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<Chatpage />} />
          <Route path="/signin" element={<Signin showLogin={true} />} />
          <Route path="/signup" element={<Signin showLogin={false} />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/blog/:slugId" element={<Blog />} />
          <Route path="/password/reset" element={<Reset />} />
          <Route path="/password/newpassword" element={<NewPassword />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </div>
  );
}

export default App;
