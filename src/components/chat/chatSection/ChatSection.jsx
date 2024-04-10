import React from "react";
import { IoMdArrowDown } from "react-icons/io";
import Chats from "../chats/Chats";
import { useState } from "react";
import { GrAddCircle, GrSubtractCircle } from "react-icons/gr";

export default function ChatSection({ month = "December ", chats = [] }) {
  const [showChats, setShowChats] = useState(true);
  return (
    <div className="">
      <div className="flex text-gray-400 my-4 justify-center items-center">
        <div className="flex-grow">{month}</div>
        <div
          className=" cursor-pointer hover:text-orange-400"
          onClick={() => setShowChats(!showChats)}
        >
          {showChats ? (
            <>
              <IoMdArrowDown size={20} />
            </>
          ) : (
            <>
              <GrAddCircle size={20} />
            </>
          )}
        </div>
      </div>
      {showChats ? (
        <>
          <div className=" flex flex-col gap-2">
            <Chats title="What is the value of saturn in astrology?" />
            <Chats />
            <Chats />
            <Chats />
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
