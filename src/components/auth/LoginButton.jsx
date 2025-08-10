import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { IoMdLogIn } from "react-icons/io";

const LoginButton = () => {
  const { loginWithAuth0 } = useAuth();

  return (
    <button 
      onClick={() => loginWithAuth0()}
      className="gap-1 px-4 text-primary flex items-center rounded justify-between"
    >
      <IoMdLogIn className="text-primary" size={18} />
      Sign in
    </button>
  );
};

export default LoginButton; 