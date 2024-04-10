import React, { useState } from "react";
import { LuSendHorizonal } from "react-icons/lu";
import SampleQuestions from "../sample/SampleQuestions";
import Reply from "../chat/reply/Reply";

export default function ChatBox() {
  const [reply, setReply] = useState(["asd"]);
  return (
    <div className="w-full flex flex-col h-[100vh]">
      {reply.length > 0 ? (
        <>
          <div className="flex-grow overflow-y-scroll flex flex-col no-scrollbar mx-auto p-2 md:p-6 w-[98%] md:w-[80%] ">
            <Reply />
            <Reply />
          </div>
        </>
      ) : (
        <>
          <div className="flex-grow overflow-y-scroll flex justify-center items-center">
            <div className="flex flex-col  w-7/12  items-center justify-center gap-4">
              <p className=" p-2 text-gray-500 font-light text-justify min-w-[350px]">
                Ask your question to &nbsp;
                <b>Sai Vidya</b> and discover profound wisdom!
              </p>
              <div>
                <SampleQuestions />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="  p-4 md:p-8 ">
        <div className="flex  justify-center  border border-gray-300 gap-2 rounded">
          <textarea
            className="flex-grow  rounded p-4 resize-none outline-none text-sm"
            id=""
            cols="10"
            rows="4"
            placeholder="Start your question"></textarea>
          <div className="text-gray-300 p-2">
            <LuSendHorizonal size={36} />
          </div>
        </div>
      </div>
    </div>
  );
}
