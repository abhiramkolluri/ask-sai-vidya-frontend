import React from "react";
import Logo from "../logo/Logo";
import { IoMdSearch } from "react-icons/io";
import ChatSection from "../chat/chatSection/ChatSection";
import { LuPencilLine } from "react-icons/lu";
export default function SideNav() {
  return (
    <div className=" w-full flex flex-col gap-2 p-4 text-sm h-[100vh] ">
      <div>
        <Logo />
      </div>
      <div className="border-b border-orange-400 flex gap-2 justify-center items-center ">
        <div className=" ml-2 text-orange-400">
          <IoMdSearch size={20} />
        </div>
        <input
          type="text"
          placeholder="Search"
          className="w-full p-2 outline-none -ml-2 "
        />
      </div>
      <div className="mt-4 flex flex-col gap-2 flex-grow overflow-y-scroll no-scrollbar">
        <ChatSection month="March" />
        <ChatSection month="Feburary" />
        <ChatSection month="Feburary" />
      </div>
      <div>
        <div className=" bg-orange-400 text-white flex items-center w-full py-4 px-2 rounded">
          <LuPencilLine size={20} />
          <p className="ml-2">New Question</p>
        </div>
      </div>
    </div>
  );
}
