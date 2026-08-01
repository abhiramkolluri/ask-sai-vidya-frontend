import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider, Auth0Context, initialContext } from '@auth0/auth0-react';
import reportWebVitals from "./reportWebVitals";

// Auth0 SPA SDK only allows https:// or localhost — not LAN IPs like 10.x.x.x.
// On a phone over Wi-Fi we skip Auth0 init; email/password + Google OAuth via
// the backend still work for local mobile testing.
function isAuth0SecureOrigin() {
  const { protocol, hostname } = window.location;
  if (protocol === "https:") return true;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

const auth0Domain = process.env.REACT_APP_AUTH0_DOMAIN || "dev-oml3gexqytc7oo2l.us.auth0.com";
const auth0ClientId = process.env.REACT_APP_AUTH0_CLIENT_ID || "6satcFsIaqEedHaMNO65bGZ61TdjcqlB";
const auth0RedirectUri = process.env.REACT_APP_AUTH0_REDIRECT_URI || "http://localhost:3000";

const appTree = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    {isAuth0SecureOrigin() ? (
      <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        authorizationParams={{ redirect_uri: auth0RedirectUri }}
      >
        {appTree}
      </Auth0Provider>
    ) : (
      <Auth0Context.Provider value={initialContext}>
        {appTree}
      </Auth0Context.Provider>
    )}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
