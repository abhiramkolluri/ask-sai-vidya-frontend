import React from "react";
import Chat from "../../images/chat.jpg";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import MaterialInput from "../input/MaterialInput";

export default function Signup({ callback = () => {} }) {
  return (
    <div className="w-[400px]  bg-white rounded overflow-hidden text-[14px] flex flex-col gap-2 justify-between text-gray-600">
      <div>
        <img src={Chat} height={"140px"} width={"400px"} alt="" />
      </div>

      <div className="p-8 ">
        <div className=" flex flex-col gap-4">
          <div className="flex flex-col gap-4 ">
            <h1 className="font-bold text-center my-4">
              Sign up to continue and save your conversation
            </h1>
            <div>
              {" "}
              <MaterialInput text="Email address" />
            </div>
            <div>
              {" "}
              <MaterialInput text="Password" password />
            </div>
            <div>
              {" "}
              <MaterialInput text="Confirm password" password />
            </div>

            <button className="w-full h-[40px] font-bold text-white bg-orange-400 shadow flex justify-center items-center rounded">
              Sign Up
            </button>
          </div>

          <h1 className="text-center font-thin">
            Already have a account?{" "}
            <span
              className=" text-orange-400 cursor-pointer"
              onClick={callback}
            >
              Sign In
            </span>{" "}
          </h1>

          <div className="border-t mt-2 border-gray-300 flex justify-center items-center">
            <div className="bg-white relative -top-[20px] p-2 text-gray-300">
              or
            </div>
          </div>
          <button className=" -mt-4 w-full h-[40px]  border border-gray-300  flex justify-between px-2 items-center rounded">
            Continue with Google
            <span>
              <FcGoogle size={18} />
            </span>
          </button>
          <button className="w-full h-[40px]  border border-gray-300  flex justify-between px-2 items-center rounded">
            Continue with Apple
            <span>
              <FaApple size={18} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
