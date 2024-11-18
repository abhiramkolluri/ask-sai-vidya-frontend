// THIS FILE SHOULD BE DEPRECIATED against the Input from the tailwind-materialize
import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { VscEye } from "react-icons/vsc";

export default function MaterialInput({
  text = "Email address",
  callback = (value) => {},
  password = false,
  value = "",
  ...rest
}) {
  const [type, setType] = useState("text");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (password) {
      setType("password");
    } else {
      setType("text");
    }
  }, [password]);

  return (
    <div className="relative w-full max-w-sm">
      <div
        className="group relative z-0 w-full"
        onClick={() => setIsFocused(true)}>
        <input
          className="h-10 rounded-md  file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground px-2  focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 peer block w-full appearance-none border-2 border-gray-300 bg-transparent py-2.5 text-sm text-gray-900 outline-none"
          id="floating-input"
          placeholder=" "
          type={type}
          onChange={(e) => {
            callback(e.target.value);
          }}
          onFocus={() => setIsFocused(true)} // Set focus on input focus
          onBlur={() => setIsFocused(false)} // Remove focus on blur
          {...rest}
        />

        {/* Conditionally apply shrinking styles */}
        <label
          className={`bg-white font-medium absolute top-3 px-2 left-2 -z-1 origin-[0] transform text-sm text-gray-500 duration-300 
             ${
               isFocused || value
                 ? "-translate-y-6 scale-75 peer-focus:-translate-y-6 peer-focus:scale-75"
                 : "translate-y-0 scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100"
             }  dark:text-gray-400`}
          htmlFor="floating-input">
          {text}
        </label>
      </div>

      {password && (
        <div
          className="h-full p-2  absolute right-0 top-0 flex justify-center items-center text-gray-400"
          onClick={() => {
            setType((prevType) =>
              prevType === "password" ? "text" : "password",
            );
          }}>
          <VscEye size={16} />
        </div>
      )}
    </div>
  );
}
