import React, { useState } from "react";
import leaves from "../../images/leaves.png";
import sai from "../../images/sai.png";
import line from "../../images/line.png";
import { IoMdLogIn } from "react-icons/io";
import { GiTreeBranch } from "react-icons/gi";
import { PiRocketLaunchThin } from "react-icons/pi";
import { IoListOutline } from "react-icons/io5";
import { Link } from "react-router-dom";

export default function Welcome() {
  const [login, setlogin] = useState(true);
  return (
    <div className=" bg-[#fffbf8] dark:bg-gray-900  w-full h-[100vh] text-gray-800 dark:text-gray-200">
      <div className="absolute top-0 left-0 opacity-100 dark:opacity-20">
        <img src={leaves} alt="" className=" h-[400px]" />
      </div>
      <div className=" flex  h-full ">
        <div className="hidden md:flex flex-col items-center justify-end  flex-grow">
          <div className="w-[700px]  flex  gap-12 justify-center items-center relative -top-20 ">
            <div className="w-[250px]">
              <img src={sai} alt="" />
            </div>
            <div className="flex flex-col w-[400px] gap-8 leading-6 tracking-wider">
              <h1 className=" text-3xl font-bold text-orange-400 dark:text-orange-500">
                Welcome to Ask Sai Vidya!
              </h1>
              <p className=" leading-relaxed  tracking-wide dark:text-gray-300">
                Embark on a spiritual journey with Sathya Sai Baba to find
                deeper understanding. Seek answers to your questions and engage
                directly for inner peace.
                <br />
                <br />
                <Link to="/signin">
                  <button className=" gap-1 shadow px-4 py-2 bg-orange-400 dark:bg-orange-600 text-white flex items-center rounded hover:bg-orange-500 dark:hover:bg-orange-700 transition-colors">
                    <IoMdLogIn size={18} /> Sign In
                  </button>
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="w-[600px] h-full bg-white dark:bg-gray-800 flex justify-center items-center px-10 relative">
          <div className=" absolute right-15">
            <img src={line} alt="" className="h-[100vh] z-10 opacity-100 dark:opacity-20" />
          </div>
          <div className=" h-full flex justify-center items-center z-20 text-[14px]">
            <div className="w-full h-[65vh] max-h-[600px] flex flex-col justify-between ">
              <div className="w-[380px] rounded  bg-white dark:bg-gray-700 p-4 flex flex-col gap-4 shadow-md relative -left-12">
                <h3 className="  flex items-center text-orange-400 dark:text-orange-500 gap-2">
                  {" "}
                  <GiTreeBranch size={24} /> Do all of your research to create Sai Center material in one place
                </h3>
                <p className=" text-balance dark:text-gray-300">
                  All of Sathya Sai Baba's primary resources are continuously
                  added to provide Vidya (Knowledge) for all your questions.
                </p>
              </div>
              <div className="w-[380px] rounded  bg-white dark:bg-gray-700 p-4 flex flex-col gap-4 shadow-md relative left-12">
                <h3 className="  flex items-center text-orange-400 dark:text-orange-500 gap-2">
                  {" "}
                  <IoListOutline size={24} /> Every response includes citations
                </h3>
                <p className=" text-balance dark:text-gray-300">
                  Each part of every answer is directly from Sathya Sai Baba's
                  primary resources. Explore the linked sources to learn more.
                </p>
              </div>
              <div className="w-[380px] rounded  bg-white dark:bg-gray-700 p-4 flex flex-col gap-4 shadow-md relative -left-12">
                <h3 className="  flex items-center text-orange-400 dark:text-orange-500 gap-2">
                  {" "}
                  <PiRocketLaunchThin size={24} /> Initiate the conversation
                  with relevant questions
                </h3>
                <p className=" text-balance dark:text-gray-300">
                  Begin with your question or utilize our suggested questions to
                  spark your curiosity about exploring the primary sources.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
