import React, { useState } from "react";
import { BsChevronDown, BsMoonStarsFill, BsSunFill } from "react-icons/bs";
import { FaRegUser } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import LoginButton from "../auth/LoginButton";
import LogoutButton from "../auth/LogoutButton";

export default function Navbar({ variant }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, isAuth0User } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
      className={`w-full ${isBlogVariant ? "bg-transparent dark:bg-transparent" : "bg-white dark:bg-gray-900"
        }  px-12 text-[14px] flex items-center justify-end py-6 relative`}>
      {isBlogVariant ? null : (
        <div className=" w-full h-[72px] bg-gradient-to-r from-primary to-orange-50 dark:from-orange-900 dark:to-gray-800 absolute -z-10"></div>
      )}

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all text-primary dark:text-orange-400"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <BsSunFill size={20} /> : <BsMoonStarsFill size={20} />}
        </button>

        {isAuthenticated && user ? (
        <div
          className="flex justify-center items-center gap-2 text-primary dark:text-orange-400 cursor-pointer "
          onClick={() => setShowDropdown((x) => !x)}>
          {isAuth0User && user?.auth0User?.picture ? (
            <img
              src={user.auth0User.picture}
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
                  class="absolute max-w-xs mx-auto  rounded bg-white dark:bg-gray-800 z-50 right-12 w-[200px] mt-4"
                  style={{
                    boxShadow: "0px 0px 16px 0px #0000001A",
                  }}>
                  <div className="flex w-full  relative justify-end ">
                    <div class=" relative right-4 -top-2 w-0 h-0 border-l-transparent border-r-transparent  border-white dark:border-gray-800 border-l-8 border-r-8 border-b-8"></div>
                  </div>

                  <div class="relative  px-3 py-3">
                    <div className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{getDisplayName()}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
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
