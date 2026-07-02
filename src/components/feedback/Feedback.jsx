import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

export default function Feedback({
  options = [
    "Very satisfied",
    "Satisfied",
    "Neutral",
    "Unsatisfied",
    "Very unsatisfied",
  ],
  title = "",
  subheader = "",
  context = null,
  question = "Thank you for helping us improve the community. Tell us more about your feedback.",
  closeModalCallback = () => {},
  onSubmit = () => {},
}) {
  const [selectedOption, setSelectedOption] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    onSubmit(selectedOption, additionalComments);
    setIsSubmitted(true);
    // Close the modal after 1.5 seconds
    setTimeout(() => {
      closeModalCallback();
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="w-[580px] h-[50vh] bg-white flex justify-center items-center flex-col gap-4 p-10 text-[14px]">
        <div className="text-[#252525] text-2xl font-semibold text-center">
          Thank You for your Feedback!
        </div>
      </div>
    );
  }

  return (
    <div className="w-[640px] max-w-[92vw] max-h-[88vh] overflow-y-auto rounded-xl shadow-2xl bg-white flex justify-start items-center flex-col gap-5 p-10 text-[14px]">
      <div className="w-full flex justify-end px-2">
        <button
          className="text-orange-400"
          onClick={() => closeModalCallback()}>
          <IoMdClose size={18} />{" "}
        </button>
      </div>
      {title && (
        <p className="text-[#252525] text-2xl font-bold text-center">{title}</p>
      )}
      {subheader && (
        <p className="text-gray-600 text-base text-center max-w-[460px] -mt-1">
          {subheader}
        </p>
      )}
      {context}
      <p className="text-[#252525] text-base font-normal text-center max-w-[520px] mb-2">
        {question}
      </p>
      <div className="flex flex-wrap gap-2 ">
        {options.map((option, index) => {
          return (
            <div
              key={index}
              className={`px-2 py-1 border ${
                selectedOption === option
                  ? "bg-[#B6C4AB]"
                  : "bg-[#E0E6DB] hover:bg-[#B6C4AB]"
              } border-gray-300 rounded cursor-pointer font-medium text-lg`}
              onClick={() => setSelectedOption(option)}>
              {option}
            </div>
          );
        })}
      </div>
      <div className="w-full">
        <textarea
          className="w-full p-2 border-[1px] text-lg outline-none border-[#C2C2C2]"
          placeholder="Please add more details about your feedback (optional)"
          value={additionalComments}
          onChange={(e) => setAdditionalComments(e.target.value)}
          rows={3}
        />
      </div>
      <div className="w-full flex justify-end">
        <button
          className="bg-[#BC5B01] hover:bg-orange-600 text-white flex w-[122px] justify-center py-3 px-2 rounded cursor-pointer ml-2 text-lg font-semibold transition-colors"
          onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}
