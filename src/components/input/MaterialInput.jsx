import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { VscEye } from "react-icons/vsc";

export default function MaterialInput({
  text = "Email address",
  callback = (value) => {},
  password = false,
  value = "",
}) {
  const [type, settype] = useState("text");
  useEffect(() => {
    if (password) {
      settype("password");
    } else {
      settype("text");
    }
  }, [password]);
  return (
    <div className="relative w-full max-w-sm">
      <div className="group relative z-0  w-full">
        {value.length > 0 ? (
          <>
            <input
              className="h-10 rounded-md  file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground px-2  focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer block w-full appearance-none border-2 border-gray-300 bg-transparent py-2.5 text-sm text-gray-900 outline-none"
              id="floating-input"
              placeholder=" "
              type={type}
              value={value}
              disabled
            />
          </>
        ) : (
          <>
            <input
              className="h-10 rounded-md  file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground px-2  focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer block w-full appearance-none border-2 border-gray-300 bg-transparent py-2.5 text-sm text-gray-900 outline-none"
              id="floating-input"
              placeholder=" "
              type={type}
              onChange={(e) => {
                callback(e.target.value);
              }}
            />
          </>
        )}

        {value.length > 0 ? (
          <></>
        ) : (
          <>
            <label
              className=" bg-white font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 absolute top-3 px-2 left-2 -z-1 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75  dark:text-gray-400 "
              for="floating-input"
            >
              {text}
            </label>
          </>
        )}
      </div>
      {password && (
        <div
          className="h-full p-2  absolute right-0 top-0 flex justify-center items-center text-gray-400"
          onClick={() => {
            if (type === "password") {
              settype("text");
            } else {
              settype("password");
            }
          }}
        >
          <VscEye size={16} />
        </div>
      )}
    </div>
  );
}
