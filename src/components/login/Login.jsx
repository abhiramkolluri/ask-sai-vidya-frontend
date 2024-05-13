import React, { useEffect } from "react";
import Chat from "../../images/chat.jpg";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import MaterialInput from "../input/MaterialInput";
import { useState } from "react";

export default function Login({ callback = () => {}, inModal = true }) {
  const [forgetPassword, setforgetPassword] = useState(false);
  useEffect(() => {}, [forgetPassword]);
  if (!forgetPassword) {
    return (
      <div className="w-[400px]  bg-white rounded overflow-hidden text-[14px] flex flex-col gap-2 justify-between text-gray-600">
        {inModal ? (
          <div>
            <img src={Chat} height={"140px"} width={"400px"} alt="" />
          </div>
        ) : (
          <></>
        )}

        <div className="p-8 ">
          <div className=" flex flex-col gap-4">
            <div className="flex flex-col gap-4 ">
              {inModal ? (
                <>
                  <h1 className="font-bold text-center my-4">
                    Sign in to continue and save your conversation
                  </h1>
                </>
              ) : (
                <></>
              )}

              <div>
                {" "}
                <MaterialInput text="Email address" />
              </div>
              <div>
                {" "}
                <MaterialInput text="Password" password />
              </div>
              <div className="text-orange-400 font-bold">
                <span
                  className="cursor-pointer"
                  onClick={() => setforgetPassword(() => true)}>
                  Forgot password?
                </span>
              </div>
              <button className="w-full h-[40px] font-bold text-white bg-orange-400 shadow flex justify-center items-center rounded">
                Sign In
              </button>
            </div>

            <h1 className="text-center font-thin">
              Create a new account?{" "}
              <span
                className=" text-orange-400 cursor-pointer"
                onClick={callback}>
                Sign Up
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
  } else {
    return (
      <div className="w-[400px]  bg-white rounded overflow-hidden text-[14px] flex flex-col gap-2 justify-between text-gray-600">
        {inModal ? (
          <>
            <div>
              <img src={Chat} height={"140px"} width={"400px"} alt="" />
            </div>
          </>
        ) : (
          <></>
        )}

        <div className="p-8 ">
          <div className=" flex flex-col gap-4">
            <div className="flex flex-col gap-4 ">
              <h1 className="font-bold text-center my-4">
                Get a password reset link
              </h1>
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
              <span
                className=" text-orange-400 cursor-pointer"
                onClick={() => setforgetPassword(false)}>
                Sign In
              </span>{" "}
            </h1>
          </div>
        </div>
      </div>
    );
  }
}
