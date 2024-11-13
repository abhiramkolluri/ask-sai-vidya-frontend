import React, { useState } from "react";
import { BsChevronBarDown, BsChevronDown } from "react-icons/bs";
import { FaRegUser, FaUserAlt } from "react-icons/fa";
import { IoMdLogIn, IoMdLogOut } from "react-icons/io";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);

  const { user, logout } = useAuth();

  return (
    <div className=" w-full bg-white   px-12 text-[14px] flex items-center justify-end py-6 relative ">
      <div className=" w-full h-[72px] bg-gradient-to-r from-primary to-orange-50 absolute -z-10"></div>
      {user ? (
        <>
          <div
            className="flex justify-center items-center gap-2 text-primary cursor-pointer "
            onClick={() => setShowDropdown((x) => !x)}>
            <FaRegUser size={18} />{" "}
            <span className="font-bold">{user.email}</span>
            <span
              className="px-4 cursor-pointer"
              // onClick={() => setShowDropdown((x) => !x)}
            >
              <BsChevronDown size={18} />
              {showDropdown ? (
                <>
                  <div
                    class="absolute max-w-xs mx-auto  rounded bg-white z-50 right-12 w-[160px] mt-4"
                    style={{
                      boxShadow: "0px 0px 16px 0px #0000001A",
                    }}>
                    <div className="flex w-full  relative justify-end ">
                      <div class=" relative right-4 -top-2 w-0 h-0 border-l-transparent border-r-transparent  border-white border-l-8 border-r-8 border-b-8"></div>
                    </div>

                    <div class="relative  px-2 py-2">
                      <button
                        onClick={() => {
                          logout();
                        }}
                        className="w-full gap-1 px-4 py-2 hover:border  hover:border-primary bg-opacity-80 bg-orange-50 active:bg-opacity-100  text-black flex items-center rounded justify-between ">
                        Sign out
                        <IoMdLogOut className="text-primary" size={18} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <></>
              )}
            </span>
          </div>
        </>
      ) : (
        <>
          <Link to="/signin">
            <button className=" gap-1  px-4   text-primary  flex items-center rounded justify-between ">
              <IoMdLogIn className="text-primary" size={18} />
              Sign in
            </button>
          </Link>
        </>
      )}
    </div>
  );
}
