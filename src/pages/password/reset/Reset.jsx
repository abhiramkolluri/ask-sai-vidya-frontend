import React, { useState } from "react";
import leaves from "../../../images/leaves.png";
import MaterialInput from "../../../components/input/MaterialInput";
import { Link } from "react-router-dom";

export default function Reset() {
  const [login, setlogin] = useState(true);
  return (
    <div className=" bg-[#fffbf8]  w-full h-[100vh] text-gray-800 text-[14px]">
      <div className="absolute top-0 left-0">
        <img src={leaves} alt="" />
      </div>
      <div className=" flex  h-full ">
        <div className="hidden md:flex flex-col items-center justify-center  flex-grow">
          <div className="w-[600px]">
            <h1 className=" text-2xl font-bold text-orange-400">
              Connect with Ask Sai Vidya!
            </h1>
            <p className=" leading-relaxed mt-4 tracking-wide">
              Embark on a spiritual journey with Sathya Sai Baba to find deeper
              understanding. Seek answers to your questions and engage directly
              for inner peace.
            </p>
          </div>
        </div>
        <div className="w-[600px] h-full bg-white flex justify-center items-center px-10">
          <div className="p-8 w-[400px]">
            <div className=" flex flex-col gap-4">
              <div className="flex flex-col gap-4 ">
                <h1 className="text-center my-4">Forget password</h1>
                <div>
                  {" "}
                  <MaterialInput text="Email address" />
                </div>

                <button className="w-full h-[40px] font-bold text-white bg-orange-400 shadow flex justify-center items-center rounded">
                  Send link
                </button>
              </div>

              <h1 className="text-center font-thin">
                Remember your password?{" "}
                <Link to="/login" className="text-orange-400">
                  <span className=" text-orange-400 cursor-pointer">
                    Sign In
                  </span>{" "}
                </Link>
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
