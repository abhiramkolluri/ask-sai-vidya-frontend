import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { IoMdLogIn } from "react-icons/io";

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <button 
      onClick={() => loginWithRedirect()}
      className="gap-1 px-4 text-primary flex items-center rounded justify-between"
    >
      <IoMdLogIn className="text-primary" size={18} />
      Sign in
    </button>
  );
};

export default LoginButton; 