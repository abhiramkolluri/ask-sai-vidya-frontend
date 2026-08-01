import React from "react";
import leaves from "../../images/leaves.png";
import sai from "../../images/sai.png";
import line from "../../images/line.png";
import { IoMdLogIn } from "react-icons/io";
import { GiTreeBranch } from "react-icons/gi";
import { PiRocketLaunchThin } from "react-icons/pi";
import { IoListOutline } from "react-icons/io5";
import { Link } from "react-router-dom";

const FEATURES = [
  {
    Icon: GiTreeBranch,
    title: "Do all of your research to create Sai Center material in one place",
    body: "All of Sathya Sai Baba's primary resources are continuously added to provide Vidya (Knowledge) for all your questions.",
    offset: "md:relative md:-left-12",
  },
  {
    Icon: IoListOutline,
    title: "Every response includes citations",
    body: "Each part of every answer is directly from Sathya Sai Baba's primary resources. Explore the linked sources to learn more.",
    offset: "md:relative md:left-12",
  },
  {
    Icon: PiRocketLaunchThin,
    title: "Initiate the conversation with relevant questions",
    body: "Begin with your question or utilize our suggested questions to spark your curiosity about exploring the primary sources.",
    offset: "md:relative md:-left-12",
  },
];

export default function Welcome() {
  return (
    <div className="bg-[#fffbf8] w-full min-h-[100dvh] text-gray-800 overflow-x-hidden">
      <div className="absolute top-0 left-0 opacity-100 pointer-events-none">
        <img src={leaves} alt="" className="h-[280px] sm:h-[400px]" />
      </div>
      <div className="absolute bottom-0 right-0 opacity-100 z-30 pointer-events-none hidden sm:block">
        <img src={sai} alt="Sai Baba" className="h-[180px] sm:h-[250px]" />
      </div>
      <div className="flex min-h-[100dvh]">
        <div className="hidden md:flex flex-col items-center justify-end flex-grow">
          <div className="w-[700px] flex gap-12 justify-center items-center relative -top-20">
            <div className="w-[250px]">
              <img src={sai} alt="" />
            </div>
            <div className="flex flex-col w-[400px] gap-8 leading-6 tracking-wider">
              <h1 className="text-3xl font-bold text-orange-400">
                Welcome to Ask Sai Vidya!
              </h1>
              <p className="leading-relaxed tracking-wide">
                Embark on a spiritual journey with Sathya Sai Baba to find
                deeper understanding. Seek answers to your questions and engage
                directly for inner peace.
                <br />
                <br />
                <Link to="/signin">
                  <button className="gap-1 shadow px-4 py-2 bg-orange-400 text-white flex items-center rounded hover:bg-orange-500 transition-colors">
                    <IoMdLogIn size={18} /> Sign In
                  </button>
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="w-full md:w-[600px] min-h-[100dvh] bg-white flex justify-center items-start md:items-center px-4 sm:px-8 md:px-10 py-10 md:py-0 relative">
          <div className="absolute right-0 hidden md:block">
            <img src={line} alt="" className="h-[100vh] z-10 opacity-100" />
          </div>
          <div className="h-full flex justify-center items-center z-20 text-[14px] w-full max-w-[420px] md:max-w-none">
            <div className="w-full md:h-[65vh] md:max-h-[600px] flex flex-col justify-center md:justify-between gap-6 md:gap-0 py-4 md:py-0">
              <div className="md:hidden text-center mb-2">
                <h1 className="text-2xl font-bold text-orange-400">Welcome to Ask Sai Vidya!</h1>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  Embark on a spiritual journey with Sathya Sai Baba to find deeper understanding.
                </p>
                <Link to="/signin" className="inline-block mt-4">
                  <button className="gap-1 shadow px-4 py-2.5 bg-orange-400 text-white flex items-center rounded hover:bg-orange-500 transition-colors mx-auto">
                    <IoMdLogIn size={18} /> Sign In
                  </button>
                </Link>
              </div>

              {FEATURES.map(({ Icon, title, body, offset }) => (
                <div
                  key={title}
                  className={`w-full md:w-[380px] rounded bg-white p-4 flex flex-col gap-3 sm:gap-4 shadow-md ${offset}`}
                >
                  <h3 className="flex items-start text-orange-400 gap-2 text-base sm:text-[15px]">
                    <Icon size={22} className="shrink-0 mt-0.5" />
                    <span>{title}</span>
                  </h3>
                  <p className="text-balance text-sm sm:text-[14px] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
