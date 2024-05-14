import React, { useState } from "react";
import leaves from "../../images/leaves.png";
import line from "../../images/line.png";
import Login from "../../components/login/Login";
import Signup from "../../components/signup/Signup";
import { IoMdLogIn } from "react-icons/io";
import { GiTreeBranch } from "react-icons/gi";
import { FaListUl } from "react-icons/fa";
import { PiRocketLaunchThin } from "react-icons/pi";
import { IoListOutline } from "react-icons/io5";
import { Link } from "react-router-dom";

export default function Welcome() {
  const [login, setlogin] = useState(true);
  return (
    <div className=" bg-[#fffbf8]  w-full h-[100vh] text-gray-800">
      <div className="absolute top-0 left-0">
        <img src={leaves} alt="" />
      </div>
      <div className=" flex  h-full ">
        <div className="hidden md:flex flex-col items-center justify-center  flex-grow">
          <div className="w-[600px] p-4 flex flex-col gap-4">
            <h1 className=" text-3xl font-bold text-orange-400">
              Welcome to Ask Sai Vidya!
            </h1>
            <p className=" leading-relaxed  tracking-wide">
              Embark on a spiritual journey with Sathya Sai Baba to find deeper
              understanding. Seek answers to your questions and engage directly
              for inner peace.
              <br />
              <br />
              <Link to="/signin">
                <button className=" gap-1 shadow px-4 py-2 bg-orange-400 text-white flex items-center rounded ">
                  <IoMdLogIn size={18} /> Sign In
                </button>
              </Link>
            </p>
          </div>
        </div>
        <div className="w-[600px] h-full bg-white flex justify-center items-center px-10 relative">
          <div className=" absolute right-15">
            <img src={line} alt="" className="h-[100vh] z-10" />
          </div>
          <div className=" h-full flex justify-center items-center z-20 text-[14px]">
            <div className="w-full h-[65vh] max-h-[600px] flex flex-col justify-between ">
              <div className="w-[380px] rounded  bg-white p-4 flex flex-col gap-4 shadow-md relative -left-12">
                <h3 className="  flex items-center text-orange-400 gap-2">
                  {" "}
                  <GiTreeBranch size={24} /> Answers are rich with Baba’s
                  teachings
                </h3>
                <p className=" text-balance">
                  All of Sathya Sai Baba's primary resources are continuously
                  added to provide Vidya (Knowledge) for all your questions.
                </p>
              </div>
              <div className="w-[380px] rounded  bg-white p-4 flex flex-col gap-4 shadow-md relative left-12">
                <h3 className="  flex items-center text-orange-400 gap-2">
                  {" "}
                  <IoListOutline size={24} /> Every response includes citations
                </h3>
                <p className=" text-balance">
                  Each part of every answer is directly from Sathya Sai Baba's
                  primary resources. Explore the linked sources to learn more.
                </p>
              </div>
              <div className="w-[380px] rounded  bg-white p-4 flex flex-col gap-4 shadow-md relative -left-12">
                <h3 className="  flex items-center text-orange-400 gap-2">
                  {" "}
                  <PiRocketLaunchThin size={24} /> Initiate the conversation
                  with relevant questions
                </h3>
                <p className=" text-balance">
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
