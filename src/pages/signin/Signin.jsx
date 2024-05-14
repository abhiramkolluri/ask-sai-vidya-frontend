import React, { useEffect, useState } from "react";
import leaves from "../../images/leaves.png";
import Login from "../../components/login/Login";
import Signup from "../../components/signup/Signup";

export default function Signin({ showLogin = false }) {
  const [login, setlogin] = useState(showLogin ? true : false);
  useEffect(() => {
    setlogin((x) => !x);
  }, [showLogin]);
  return (
    <div className=" bg-[#fffbf8]  w-full h-[100vh] text-gray-800">
      <div className="absolute top-0 left-0">
        <img src={leaves} alt="" />
      </div>
      <div className=" flex  h-full ">
        <div className="hidden md:flex flex-col items-center justify-center  flex-grow">
          <div className="w-[600px]">
            <h1 className=" text-2xl font-bold text-orange-400">
              Welcome to ask Sai Vidya!
            </h1>
            <p className=" leading-relaxed mt-4 tracking-wide">
              Embark on a spiritual journey with Sathya Sai Baba to find deeper
              understanding. Seek answers to your questions and engage directly
              for inner peace.
            </p>
          </div>
        </div>
        <div className="w-[600px] h-full bg-white flex justify-center items-center px-10">
          <div>
            <div className="w-full   flex ">
              <div
                className={` w-full cursor-pointer transition-all ease-in flex justify-center items-center py-4 ${
                  login
                    ? "border-b border-orange-400"
                    : " border-b border-transparent text-gray-300"
                }`}
                onClick={() => setlogin(true)}
              >
                Sign in
              </div>
              <div
                className={` w-full cursor-pointer transition-all ease-in flex justify-center items-center py-4 ${
                  !login
                    ? "border-b border-orange-400"
                    : " border-b border-transparent text-gray-300"
                }`}
                onClick={() => setlogin(false)}
              >
                Sign Up
              </div>
            </div>
            {login ? (
              <>
                <Login inModal={false} />
              </>
            ) : (
              <>
                <Signup inModal={false} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
