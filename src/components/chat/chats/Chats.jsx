import React, { useEffect } from "react";
import { useState } from "react";
import { BsChatLeftDots } from "react-icons/bs";

export default function Chats({
  id = "12345",
  title = "What is the question?",
  quesNumbers = "0",
  date = "12/12/2021",
}) {
  const [active, setactive] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setactive(() => false);
  }, 1000);
  }, [active]);
  return (
    <div
      className={`w-full p-2 flex flex-col text-sm gap-2  transition-all ease-in-out cursor-pointer border ${
        active ? "bg-orange-50 border border-orange-400" : "border-transparent "
      } rounded`}
      onClick={() => setactive(() => !active)}>
      <div className={`flex gap-2 text-gray-600  items-center `}>
        <span className={`${active ? "text-orange-400" : ""}`}>
          <BsChatLeftDots size={16} />
        </span>
        <p className="truncate w-50">{title}</p>
      </div>
      <div className=" flex text-xs text-gray-400 font-thin">
        {active ? (
          <></>
        ) : (
          <>
            <div className="flex-grow ">
              <p>{quesNumbers + " "} Questions</p>
            </div>
          </>
        )}

        <div>
          <p className={`${active ? "text-orange-400" : ""}`}>
            {new Date(date).getDate() +
              " " +
              new Date(date).toLocaleString("en-US", { month: "short" })}
          </p>
        </div>
      </div>
    </div>
  );
}
