import React, { useEffect, useState } from "react";
import Logo from "../logo/Logo";
import { IoMdSearch } from "react-icons/io";
import ChatSection from "../chat/chatSection/ChatSection";
import { LuPencilLine } from "react-icons/lu";
import sortAndMapDataByMonthAndYear from "../../helpers/sortAndMapDataByMonthAndYear";
import data from "../../data/chatSectionData";
export default function SideNav({ startNewChatCallback = () => {} }) {
  const [sectionData, setsectionData] = useState([]);
  const [year, setyear] = useState("");
  useEffect(() => {
    setsectionData(sortAndMapDataByMonthAndYear(data));
    // setyear(sortAndMapDataByMonthAndYear(data)[0].split(" ")[1]);
    // setyear("2021");
  }, []);
  let customyear =
    sectionData.length > 0 ? sectionData[0][0].split(" ")[1] : "";

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
        {sectionData.map((section, index) => {
          return (
            <div>
              {customyear == section[0].split(" ")[1] ? (
                <></>
              ) : (
                <>
                  <div className=" flex items-center gap-4">
                    <div className="flex-grow border border-gray-200 h-[0px] "></div>
                    <div className="text-gray-500 font-bold">
                      {section[0].split(" ")[1]}
                    </div>
                  </div>
                  <div className="hidden">
                    {(customyear = section[0].split(" ")[1])}
                  </div>
                </>
              )}
              <ChatSection
                key={index}
                month={section[0].split(" ")[0]}
                chats={section[1]}
              />
            </div>
          );
        })}
      </div>
      <div>
        <div
          onClick={() => startNewChatCallback()}
          className=" bg-orange-400 text-white flex items-center w-full py-4 px-2 rounded cursor-pointer">
          <LuPencilLine size={20} />
          <p className="ml-2">New Question</p>
        </div>
      </div>
    </div>
  );
}
