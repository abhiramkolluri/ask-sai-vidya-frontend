import React from "react";
import { useNavigate } from "react-router-dom";
import { IoMdLogIn } from "react-icons/io";

const LoginButton = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/signin');
  };

  return (
    <button
      onClick={handleLoginClick}
      className="gap-1 px-4 text-primary flex items-center rounded justify-between hover:bg-orange-50 transition-colors"
    >
      <IoMdLogIn className="text-primary" size={18} />
      Sign in
    </button>
  );
};

export default LoginButton; 