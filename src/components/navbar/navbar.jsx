import React, { useState } from "react";
import { BsChevronBarDown, BsChevronDown } from "react-icons/bs";
import { FaUserAlt } from "react-icons/fa";
import { IoMdLogOut } from "react-icons/io";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  return (
    <div className=" w-full bg-white   px-6 text-[14px] flex items-center justify-end py-6 relative ">
      <div className=" w-full h-[72px] bg-gradient-to-r from-orange-400 to-orange-50 absolute -z-10"></div>
      <div className="flex justify-center items-center gap-2 text-orange-400 ">
        <FaUserAlt size={18} />{" "}
        <span className="font-bold">someone@gmail.com</span>
        <span
          className="px-4 cursor-pointer"
          onClick={() => setShowDropdown((x) => !x)}
        >
          <BsChevronDown size={18} />
          {showDropdown ? (
            <>
              <div class="absolute max-w-xs mx-auto bg-white rounded-lg shadow-lg z-20 right-10 w-[160px] mt-4">
                <div class="px-2 py-2">
                  <button className="w-full gap-1 shadow px-4 py-2 border border-orange-400 bg-orange-50  text-black flex items-center rounded justify-between ">
                    Sign out
                    <IoMdLogOut className="text-orange-400" size={18} />
                  </button>
                </div>
                <div class="absolute top-0 right-0 w-0 h-0 border-t-8 border-r-8 border-white"></div>
              </div>
            </>
          ) : (
            <></>
          )}
        </span>
      </div>
    </div>
  );
}
