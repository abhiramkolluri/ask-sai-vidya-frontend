import React, { useEffect, useState } from "react";
import leaves from "../../images/leaves.png";
import Login from "../../components/login/Login";
import Signup from "../../components/signup/Signup";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Signin({ showLogin = false }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isLoginPage = location.pathname === "/signin";

  // const [login, setlogin] = useState(showLogin ? true : false);
  // useEffect(() => {
  //   setlogin((x) => !x);
  // }, [showLogin]);

  return (
    <div className=" bg-[#fffbf8]  lg:w-full md:w-auto h-[100vh] text-gray-800">
      <div
        className="absolute top-0 left-0 h-full w-full bg-no-repeat"
        style={{ backgroundImage: `url("${leaves}")` }}>
        {/* <img src={leaves} alt="" /> */}
      </div>
      <div className=" flex  h-full ">
        <div className="hidden md:flex flex-col items-center justify-center  flex-grow">
          <div className="lg:w-[600px] p-4">
            <h1 className=" text-3xl font-bold text-primary">
              Welcome to Ask Sai Vidya!
            </h1>
            <p className=" leading-relaxed mt-4 tracking-wide">
              Embark on a spiritual journey with Sathya Sai Baba to find deeper
              understanding. Seek answers to your questions and engage directly
              for inner peace.
            </p>
          </div>
        </div>
        <div className="sm:w-[100%] lg:w-[600px] h-full bg-white flex justify-center py-20 px-10 z-10">
          <div>
            <div className="w-full flex ">
              <div
                className={` w-full transition-all ease-in flex justify-center items-center py-4 text-lg font-bold ${
                  isLoginPage
                    ? "border-b border-primary"
                    : " border-b border-gray-200 text-gray-400"
                }`}
                onClick={() => navigate("/signin", { replace: true })}>
                <Link to="/signin">Sign in</Link>
              </div>
              <div
                className={`w-full transition-all ease-in flex justify-center items-center text-lg font-bold ${
                  !isLoginPage
                    ? "border-b border-primary"
                    : " border-b border-gray-200 text-gray-400"
                }`}
                onClick={() => navigate("/signup", { replace: true })}>
                <Link to="/signup" className="py-4">
                  Sign up
                </Link>
              </div>
            </div>
            {isLoginPage ? (
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
