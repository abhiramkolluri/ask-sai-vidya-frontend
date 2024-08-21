import React, { useState } from "react";
import Logo from "../../components/logo/Logo";

import { BsChevronBarDown, BsChevronDown } from "react-icons/bs";
import { FaRegUser, FaUserAlt } from "react-icons/fa";
import { IoMdList, IoMdLogIn, IoMdLogOut } from "react-icons/io";
import { Link } from "react-router-dom";
import bgflower from "../../images/bgflower.png";
import { LuPencilLine } from "react-icons/lu";
import { IoCalendar } from "react-icons/io5";

export default function Blog() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggedin, setLoggedin] = useState(true);
  return (
    <div className="w-full">
      <div className="w-full h-[375px] flex flex-col bg-[#FE9F440A] items-center">
        <div className="p-9 flex justify-between w-full">
          {/* nav section */}
          <Logo />
          {loggedin ? (
            <>
              {" "}
              <div className="flex justify-center items-center gap-2 text-orange-400 ">
                <FaRegUser size={18} />{" "}
                <span className="font-bold">someone@gmail.com</span>
                <span
                  className="px-4 cursor-pointer"
                  onClick={() => setShowDropdown((x) => !x)}
                >
                  <BsChevronDown size={18} />
                  {showDropdown ? (
                    <>
                      <div
                        class="absolute max-w-xs mx-auto  rounded bg-white z-50 right-12 w-[160px] mt-4"
                        style={{
                          boxShadow: "0px 0px 16px 0px #0000001A",
                        }}
                      >
                        <div className="flex w-full  relative justify-end ">
                          <div class=" relative right-4 -top-2 w-0 h-0 border-l-transparent border-r-transparent  border-white border-l-8 border-r-8 border-b-8"></div>
                        </div>

                        <div class="relative  px-2 py-2">
                          <button
                            onClick={() => {
                              setLoggedin(false);
                            }}
                            className="w-full gap-1 shadow px-4 py-2 border  border-orange-400 bg-orange-50  text-black flex items-center rounded justify-between "
                          >
                            Sign out
                            <IoMdLogOut className="text-orange-400" size={18} />
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
                <button className=" gap-1  px-4   text-orange-400  flex items-center rounded justify-between ">
                  <IoMdLogIn className="text-orange-400" size={18} />
                  Sign in
                </button>
              </Link>
            </>
          )}
        </div>
        <h1 className=" text-[22px] text-center font-bold mb-10">
          What is self realization?
        </h1>
        <button className=" gap-1 shadow px-4 py-2 bg-orange-400 text-white flex items-center rounded mb-2">
          <LuPencilLine size={18} /> Go back to chat
        </button>
        <div>
          <img src={bgflower} alt="" className="w-full " />
        </div>
      </div>
      <div className="flex flex-wrap justify-center  w-[96vw] max:w-[1400px] mx-auto md:gap-12 gap-4 leading-8">
        <div className=" flex flex-col md:w-[800px]  border border-gray-300 rounded shadow p-8 gap-8 relative -top-20 bg-white">
          <h2 className=" text-[20px] mt-4 text-center font-bold text-[#4D4D4D]">
            Shristi and Dristi
          </h2>
          <div className="w-full flex justify-between">
            <div className="flex gap-2 text-sm items-center">
              <IoMdList size={18} className="text-orange-400" />
              <p className="text-gray-500">SSS, Vol 29 Disc. 10</p>
            </div>
            <div className="flex gap-2 text-sm items-center ">
              <IoCalendar size={18} className="text-orange-400" />
              <p className="text-gray-500">12 April 1996</p>
            </div>
          </div>
          <div className="p-4 md:p-8  flex flex-col gap-8">
            {/* content */}
            <p>
              Pariatur do Lorem reprehenderit ad consequat ad enim id amet amet
              labore. Veniam ut laborum officia commodo amet pariatur
              consectetur reprehenderit. Magna quis nulla fugiat est ipsum duis
              commodo minim culpa pariatur minim. Labore adipisicing et velit
              fugiat dolor do. Fugiat incididunt culpa velit incididunt velit et
              do amet ex ipsum id officia id.
            </p>
            <div className="flex flex-col gap-4">
              <h3 className="font-bold">Some Heading</h3>
              <p>
                Pariatur do Lorem reprehenderit ad consequat ad enim id amet
                amet labore. Veniam ut laborum officia commodo amet pariatur
                consectetur reprehenderit. Magna quis nulla fugiat est ipsum
                duis commodo minim culpa pariatur minim. Labore adipisicing et
                velit fugiat dolor do. Fugiat incididunt culpa velit incididunt
                velit et do amet ex ipsum id officia id.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-bold">Some Heading</h3>
              <p>
                Pariatur do Lorem reprehenderit ad consequat ad enim id amet
                amet labore. Veniam ut laborum officia commodo amet pariatur
                consectetur reprehenderit. Magna quis nulla fugiat est ipsum
                duis commodo minim culpa pariatur minim. Labore adipisicing et
                velit fugiat dolor do. Fugiat incididunt culpa velit incididunt
                velit et do amet ex ipsum id officia id.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="font-bold">Some Heading</h3>
              <p>
                Pariatur do Lorem reprehenderit ad consequat ad enim id amet
                amet labore. Veniam ut laborum officia commodo amet pariatur
                consectetur reprehenderit. Magna quis nulla fugiat est ipsum
                duis commodo minim culpa pariatur minim. Labore adipisicing et
                velit fugiat dolor do. Fugiat incididunt culpa velit incididunt
                velit et do amet ex ipsum id officia id.
              </p>
            </div>
          </div>
        </div>
        <div className="w-[440px] flex flex-col mt-12 gap-2 ">
          <p>Citations</p>
          <div className="w-[420px] bg-[##FE9F440A] border border-[#FE9F44] rounded-lg p-6 flex flex-col gap-4">
            <p className="text-[#4D4D4D]">Sristi and Dristhi</p>
            <div className="flex gap-2 text-sm items-center">
              <IoMdList size={18} className="text-orange-400" />
              <p className="text-gray-500">SSS, Vol 29 Disc. 10</p>
            </div>
            <div className="flex gap-2 text-sm items-center ">
              <IoCalendar size={18} className="text-orange-400" />
              <p className="text-gray-500">12 April 1996</p>
            </div>
          </div>
          <div className="w-[420px]  border-b rounded-lg p-6 flex flex-col gap-4">
            <p>Nammi Nammi</p>
            <div className="flex gap-2 text-sm items-center">
              <IoMdList size={18} className="text-orange-400" />
              <p className="text-gray-500">SSS, Vol 29 Disc. 10</p>
            </div>
            <div className="flex gap-2 text-sm items-center ">
              <IoCalendar size={18} className="text-orange-400" />
              <p className="text-gray-500">12 April 1996</p>
            </div>
          </div>
          <div className="w-[420px]  border-b rounded-lg p-6 flex flex-col gap-4">
            <p>Power of meditation</p>
            <div className="flex gap-2 text-sm items-center">
              <IoMdList size={18} className="text-orange-400" />
              <p className="text-gray-500">SSS, Vol 29 Disc. 10</p>
            </div>
            <div className="flex gap-2 text-sm items-center ">
              <IoCalendar size={18} className="text-orange-400" />
              <p className="text-gray-500">12 April 1996</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
