import React from "react";
import { IoMdClose } from "react-icons/io";

export default function Feedback({
  options = [
    "Very satisfied",
    "Satisfied",
    "Neutral",
    "Unsatisfied",
    "Very unsatisfied",
  ],
  question = " Provide feedback for improvement",
  closeModalCallback = () => {},
}) {
  return (
    <div className="w-[400px] bg-white flex justify-center items-center flex-col gap-4 p-6 text-[14px] ">
      <div className="w-full flex justify-end px-2">
        <button
          className="text-orange-400"
          onClick={() => closeModalCallback()}
        >
          <IoMdClose size={18} />{" "}
        </button>
      </div>
      <h3 className="text-center mb-4"> {question}</h3>
      <div className="flex flex-wrap  gap-4 ">
        {options.map((option, index) => {
          return (
            <div
              key={index}
              className="px-2 py-1 border bg-gray-100 border-gray-300 rounded cursor-pointer"
            >
              {option}
            </div>
          );
        })}
      </div>
      <div>
        <textarea
          className="w-full p-2 border-2 outline-none border-gray-200"
          placeholder="(Optional) Please enter any other details"
          name=""
          id=""
          rows={3}
          cols={46}
        ></textarea>
      </div>
      <div className=" bg-orange-400 text-white flex items-center justify-center w-full py-3 px-2 rounded cursor-pointer">
        <p className="ml-2 text-base">Submit</p>
      </div>
    </div>
  );
}
