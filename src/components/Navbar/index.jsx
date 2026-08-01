import React, { useState } from "react";
import { BsChevronDown } from "react-icons/bs";
import { FaRegUser } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import LoginButton from "../auth/LoginButton";
import LogoutButton from "../auth/LogoutButton";

export default function Navbar({ variant, tabs }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, isAuth0User } = useAuth();
  const isBlogVariant = variant === "blog";

  // Get display name (name, nickname, or first_name last_name)
  const getDisplayName = () => {
    if (isAuth0User && user?.auth0User?.name) return user.auth0User.name;
    if (isAuth0User && user?.auth0User?.nickname) return user.auth0User.nickname;

    // For custom auth users, show first_name and last_name
    if (!isAuth0User && user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }

    return user?.email || "User";
  };

  const isAuthenticated = !!user;

  return (
    <div
      className={`w-full ${isBlogVariant ? "bg-transparent" : "bg-white"
        } px-4 sm:px-8 md:px-12 text-[14px] flex items-center ${tabs ? "justify-between gap-2" : "justify-end"} py-4 sm:py-6 relative min-h-[3.5rem] sm:min-h-[4.5rem]`}>
      {isBlogVariant ? null : (
        <div className="w-full h-full min-h-[3.5rem] sm:min-h-[4.5rem] bg-gradient-to-r from-primary to-orange-50 absolute inset-0 -z-10"></div>
      )}

      {tabs ? <div className="pl-11 sm:pl-8 min-w-0 shrink">{tabs}</div> : null}

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {isAuthenticated && user ? (
          <div
            className="flex justify-center items-center gap-1.5 sm:gap-2 text-primary cursor-pointer"
            onClick={() => setShowDropdown((x) => !x)}>
            {isAuth0User && user?.auth0User?.picture ? (
              <img
                src={user.auth0User.picture}
                alt="Profile"
                className="w-7 h-7 sm:w-6 sm:h-6 rounded-full"
              />
            ) : (
              <FaRegUser size={18} />
            )}
            <span className="font-bold hidden sm:inline max-w-[120px] md:max-w-none truncate">{getDisplayName()}</span>
            <span className="cursor-pointer p-1 sm:px-4 relative">
              <BsChevronDown size={18} />
              {showDropdown ? (
                <>
                  <div
                    className="absolute max-w-xs mx-auto rounded bg-white z-50 right-0 sm:right-12 w-[min(200px,calc(100vw-2rem))] mt-4"
                    style={{
                      boxShadow: "0px 0px 16px 0px #0000001A",
                    }}>
                    <div className="flex w-full relative justify-end">
                      <div className="relative right-4 -top-2 w-0 h-0 border-l-transparent border-r-transparent border-white border-l-8 border-r-8 border-b-8"></div>
                    </div>

                    <div className="relative px-3 py-3">
                      <div className="mb-2 pb-2 border-b border-gray-200">
                        <div className="font-semibold text-gray-800 break-words">{getDisplayName()}</div>
                        <div className="text-sm text-gray-600 break-all">{user.email}</div>
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
    </div>
  );
}
