import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "react-query";
import { apiRoute } from "../helpers/apiRoute";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState();
  const [success, setSuccess] = useState(null);
  // Get access token from local storage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setUser({ token: storedToken }); // Assuming token is enough to identify user
    }
  }, []);

  useEffect(() => {
    const clearErrorTimeout = setTimeout(() => {
      setError(false);
    }, 5000);
    return () => clearTimeout(clearErrorTimeout);
  }, [error]);

  // React Query for login mutation
  const { mutate: login, isLoading: loggingIn } = useMutation(
    async (credentials) => {
      setError(null);
      setSuccess(null);
      const response = await fetch(apiRoute("login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      return response.json();
    },
    {
      onSuccess: (data) => {
        localStorage.setItem("access_token", data.access_token);
        setUser({ token: data.access_token });
        setTimeout(() => {
          navigate("/"); // Redirect to chat page
        }, 3500);

        setSuccess("Successfully logged in");
      },
      onError: (error) => {
        setError(error.message);
        setSuccess(null);
      },
    },
  );

  // React Query for registration mutation
  const { mutate: register, isLoading: registering } = useMutation(
    async (userData) => {
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append("first_name", userData.first_name);
      formData.append("last_name", userData.last_name);
      formData.append("email", userData.email);
      formData.append("password", userData.password);

      const response = await fetch(apiRoute("register"), {
        method: "POST",
        // headers: { "Content-Type": "application/json" },
        body: formData,
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
    },
    {
      onSuccess: () => {
        setSuccess("Successfully registered, redirecting you shortly.");
        setTimeout(() => {
          navigate("/signin"); // Redirect to login page
          setSuccess(null);
        }, 2500);
      },
      onError: (error) => {
        setError(error.message);
        setSuccess(null);
      },
    },
  );

  const logout = () => {
    localStorage.removeItem("access_token");
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
