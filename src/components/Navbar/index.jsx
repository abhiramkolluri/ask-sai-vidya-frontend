import React, { useState } from "react";
import { BsChevronDown } from "react-icons/bs";
import { FaRegUser } from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";
import LoginButton from "../auth/LoginButton";
import LogoutButton from "../auth/LogoutButton";

export default function Navbar({ variant }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, isAuthenticated } = useAuth0();
  const isBlogVariant = variant === "blog";

  // Get display name (name, nickname, or email)
  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.nickname) return user.nickname;
    return user?.email || "User";
  };

  return (
    <div
      className={`w-full ${
        isBlogVariant ? "bg-transparent" : "bg-white"
      }  px-12 text-[14px] flex items-center justify-end py-6 relative`}>
      {isBlogVariant ? null : (
        <div className=" w-full h-[72px] bg-gradient-to-r from-primary to-orange-50 absolute -z-10"></div>
      )}

      {isAuthenticated && user ? (
        <div
          className="flex justify-center items-center gap-2 text-primary cursor-pointer "
          onClick={() => setShowDropdown((x) => !x)}>
          {user.picture ? (
            <img 
              src={user.picture} 
              alt="Profile" 
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <FaRegUser size={18} />
          )}
          <span className="font-bold">{getDisplayName()}</span>
          <span
            className="px-4 cursor-pointer"
            // onClick={() => setShowDropdown((x) => !x)}
          >
            <BsChevronDown size={18} />
            {showDropdown ? (
              <>
                <div
                  class="absolute max-w-xs mx-auto  rounded bg-white z-50 right-12 w-[200px] mt-4"
                  style={{
                    boxShadow: "0px 0px 16px 0px #0000001A",
                  }}>
                  <div className="flex w-full  relative justify-end ">
                    <div class=" relative right-4 -top-2 w-0 h-0 border-l-transparent border-r-transparent  border-white border-l-8 border-r-8 border-b-8"></div>
                  </div>

                  <div class="relative  px-3 py-3">
                    <div className="mb-2 pb-2 border-b border-gray-200">
                      <div className="font-semibold text-gray-800">{getDisplayName()}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                    <LogoutButton />
                  </div>
                </div>
              </>
            ) : (
              <></>
            )}
          </span>
        </div>
      ) : (
        <LoginButton />
      )}
    </div>
  );
}
