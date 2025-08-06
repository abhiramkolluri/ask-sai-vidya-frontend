import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { IoMdLogOut } from "react-icons/io";

const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <button 
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="w-full gap-1 px-4 py-2 hover:border hover:border-primary bg-opacity-80 bg-orange-50 active:bg-opacity-100 text-black flex items-center rounded justify-between"
    >
      Sign out
      <IoMdLogOut className="text-primary" size={18} />
    </button>
  );
};

export default LogoutButton; 