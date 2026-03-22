import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState();
  const [success, setSuccess] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Auth0 integration (keep for backward compatibility)
  const {
    user: auth0User,
    isAuthenticated: auth0IsAuthenticated,
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout
  } = useAuth0();

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser({
          ...parsedUser,
          token: savedToken,
          isAuth0: false
        });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Custom login function
  const login = async (credentials) => {
    setLoggingIn(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
          email: data.user.email,
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          token: data.access_token,
          isAuth0: false
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify({
          email: data.user.email,
          first_name: data.user.first_name,
          last_name: data.user.last_name
        }));
        localStorage.setItem('token', data.access_token);
        setSuccess('Login successful!');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Custom register function
  const register = async (userData) => {
    setRegistering(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Logging you in...');

        // Automatically log in the user after successful registration
        setTimeout(async () => {
          try {
            await login({
              email: userData.email,
              password: userData.password
            });
          } catch (loginError) {
            console.error('Auto-login after registration failed:', loginError);
            setSuccess('Registration successful! Please log in.');
          }
        }, 1000); // Small delay to show success message

      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  // Handle Auth0 authentication (keep for backward compatibility)
  const handleAuth0User = async () => {
    if (auth0IsAuthenticated && auth0User) {
      try {
        // Get Auth0 access token
        const auth0Token = await getAccessTokenSilently();

        // Create a unified user object that works with our backend
        const unifiedUser = {
          token: auth0Token,
          email: auth0User.email,
          auth0User: auth0User,
          isAuth0: true
        };

        setUser(unifiedUser);
      } catch (error) {
        console.error("Error getting Auth0 token:", error);
        setUser(null);
      }
    }
  };

  // Handle Auth0 user changes (only if no custom user is logged in)
  useEffect(() => {
    if (!user || user.isAuth0) {
      handleAuth0User();
    }
  }, [auth0IsAuthenticated, auth0User]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const clearErrorTimeout = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(clearErrorTimeout);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const clearSuccessTimeout = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(clearSuccessTimeout);
    }
  }, [success]);

  // Auth0 login function (keep for backward compatibility)
  const loginWithAuth0 = () => {
    loginWithRedirect();
  };

  // Unified logout function
  const logout = () => {
    if (user?.isAuth0) {
      auth0Logout({ returnTo: window.location.origin });
    } else {
      // Custom logout
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setSuccess('Logged out successfully!');
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loginWithAuth0,
    loggingIn,
    registering,
    error,
    success,
    isAuth0User: user?.isAuth0 || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
