import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "react-query";
import jwtDecode from "jwt-decode";

// import { apiRoute } from "../helpers/apiRoute";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState();
  const [success, setSuccess] = useState(null);

  const updateUserFromLocalStorage = () => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      try {
        // Check if it's our mock token
        if (storedToken.startsWith("mock-jwt-token-")) {
          // For mock tokens, extract email from the token or use a default
          const mockEmail = localStorage.getItem("user_email") || "user@example.com";
          setUser({ token: storedToken, email: mockEmail });
        } else {
          // For real JWT tokens, decode them
          const decodedToken = jwtDecode(storedToken);
          const userEmail = decodedToken.sub;
          setUser({ token: storedToken, email: userEmail });
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_email");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  // Get access token from local storage on mount
  useEffect(() => {
    updateUserFromLocalStorage();
  }, []);

  useEffect(() => {
    const clearErrorTimeout = setTimeout(() => {
      setError(false);
    }, 5000);
    return () => clearTimeout(clearErrorTimeout);
  }, [error]);

  // React Query for login mutation - No validation for now
  const { mutate: login, isLoading: loggingIn } = useMutation(
    async (credentials) => {
      setError(null);
      setSuccess(null);
      
      // Simulate successful login without validation
      const mockToken = "mock-jwt-token-" + Date.now();
      const mockUser = {
        id: 1,
        email: credentials.email,
        name: credentials.email.split('@')[0],
        token: mockToken
      };
      
      return { access_token: mockToken, user: mockUser };
      
      // Original API call - commented out for now
      /*
      const response = await fetch(apiRoute("login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      return response.json();
      */
    },
    {
      onSuccess: (data) => {
        setSuccess("Successfully logged in");

        setTimeout(() => {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("user_email", data.user.email);
          setUser(data.user); // Set user immediately
          navigate("/home"); // Redirect to chat page
          setSuccess(null);
        }, 1000);
      },
      onError: (error) => {
        setError(error.message);
        setSuccess(null);
      },
    },
  );

  // React Query for registration mutation - No validation for now
  const { mutate: register, isLoading: registering } = useMutation(
    async (userData) => {
      setError(null);
      setSuccess(null);

      // Simulate successful registration without validation
      const mockToken = "mock-jwt-token-" + Date.now();
      const mockUser = {
        id: Date.now(),
        email: userData.email,
        name: `${userData.first_name} ${userData.last_name}`,
        token: mockToken
      };
      
      return { access_token: mockToken, user: mockUser };

      // Original API call - commented out for now
      /*
      const formData = new FormData();
      formData.append("first_name", userData.first_name);
      formData.append("last_name", userData.last_name);
      formData.append("email", userData.email);
      formData.append("password", userData.password);

      const response = await fetch(apiRoute("register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Email already exists"); // Specific error for 409
        } else {
          // Handle other status codes or throw a generic error
          const errorData = await response.json(); // Assuming API returns JSON error
          throw new Error(
            errorData.message ||
              "Registration failed due to some internal error, please retry!",
          );
        }
      }
      return response.json();
      */
    },
    {
      onSuccess: (data) => {
        setSuccess("Successfully registered, redirecting you shortly.");
        setTimeout(() => {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("user_email", data.user.email);
          setUser(data.user); // Set user immediately
          navigate("/home"); // Redirect to chat page
          setSuccess(null);
        }, 1000);
      },
      onError: (error) => {
        setError(error.message);
        setSuccess(null);
      },
    },
  );

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    setUser(null);
    navigate("/"); // Redirect to root
  };

  const value = {
    user,
    login,
    loggingIn,
    register,
    registering,
    logout,
    error,
    success,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
