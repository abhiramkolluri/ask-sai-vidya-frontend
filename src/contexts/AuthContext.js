import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState();
  const [success, setSuccess] = useState(null);
  
  // Auth0 integration
  const { 
    user: auth0User, 
    isAuthenticated: auth0IsAuthenticated, 
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout
  } = useAuth0();

  // Handle Auth0 authentication
  const handleAuth0User = async () => {
    if (auth0IsAuthenticated && auth0User) {
      try {
        // Get Auth0 access token
        const auth0Token = await getAccessTokenSilently();
        
        // TEMPORARY: Log the token for debugging
        console.log('🔑 Auth0 Access Token:', auth0Token);
        console.log('📧 Auth0 User Email:', auth0User.email);
        
        // Create a unified user object that works with our backend
        const unifiedUser = {
          token: auth0Token,
          email: auth0User.email,
          auth0User: auth0User, // Keep the full Auth0 user object for reference
          isAuth0: true
        };
        
        setUser(unifiedUser);
      } catch (error) {
        console.error("Error getting Auth0 token:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  // Handle Auth0 user changes
  useEffect(() => {
    handleAuth0User();
  }, [auth0IsAuthenticated, auth0User]);

  useEffect(() => {
    const clearErrorTimeout = setTimeout(() => {
      setError(false);
    }, 5000);
    return () => clearTimeout(clearErrorTimeout);
  }, [error]);

  // Auth0 login function
  const loginWithAuth0 = () => {
    loginWithRedirect();
  };

  // Auth0 logout function
  const logout = () => {
    auth0Logout({ returnTo: window.location.origin });
  };

  const value = {
    user,
    logout,
    loginWithAuth0,
    error,
    success,
    isAuth0User: true, // Always true since we only use Auth0
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
