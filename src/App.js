import React from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
// import { ReactQueryDevtools } from "react-query/devtools";

import Chatpage from "./pages/chatpage/Chatpage";
import "./App.css";
// import Login from "./components/login/Login";
import Signin from "./pages/signin/Signin";
import Welcome from "./pages/welcome/Welcome";
import Reset from "./pages/password/reset/Reset";
import NewPassword from "./pages/password/reset/NewPassword";
import Blog from "./pages/blog/Blog";
import ErrorPage from "./components/error/ErrorPage";
import UserList from "./components/UserList/UserList";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "@material-tailwind/react";

const queryClient = new QueryClient();

function App() {
  return (
    <div className="App">
      {/* <Chatpage /> */}

      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              {/* Root path redirects to welcome page or home if authenticated */}
              <Route path="/" element={<RootRedirect />} />

              {/* Welcome page - accessible to everyone */}
              <Route path="/welcome" element={<Welcome />} />

              {/* auth routes: should redirect to the home if user already authenticated */}
              <Route element={<ProtectedRoute />}>
                <Route path="/signin" element={<Signin showLogin={true} />} />
                <Route path="/signup" element={<Signin showLogin={false} />} />
                <Route path="/password/reset" element={<Reset />} />
                <Route path="/password/newpassword" element={<NewPassword />} />
              </Route>

              {/* should be protected */}
              <Route element={<PrivateRoute />}>
                <Route path="/home" element={<Chatpage />} />
                <Route path="/users" element={<UserList />} />
              </Route>
              <Route path="/blog/:slugId" element={<Blog />} />
              <Route path="*" element={<ErrorPage />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>

        {/* for debugging react-query */}
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </div>
  );
}

// RootRedirect component - redirects to home if authenticated, welcome if not
const RootRedirect = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/home" replace /> : <Navigate to="/welcome" replace />;
};

// PrivateRoute component for protected routes
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/signin" />;
};

// ProtectedRoute component for auth routes
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? <Outlet /> : <Navigate to="/home" />;
};

export default App;
