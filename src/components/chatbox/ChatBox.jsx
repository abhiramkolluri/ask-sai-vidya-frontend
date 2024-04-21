import React, { useState, useEffect, useRef } from "react";
import { LuSendHorizonal } from "react-icons/lu";
import SampleQuestions from "../sample/SampleQuestions";
import Reply from "../chat/reply/Reply";
import { BsPersonVideo } from "react-icons/bs";

export default function ChatBox({ newChat }) {
  const [question, setquestion] = useState([]);
  const [askQuestion, setaskQuestion] = useState("");
  const containerRef = useRef(null);
  const [loading, setloading] = useState(false);

  const chat = [
    {
      question: "this is the question",
      reply: {
        answer: "this is the answer",
        date: "12/12/2021",
      },
    },
  ];

  const handleKeyPress = async (event) => {
    // Check if the pressed key is the "Enter" key
    if (event.key === "Enter") {
      setquestion((x) => [...x, event.target.value]);
      setaskQuestion("");
    }
  };

  const inputRef = useRef(null);

  useEffect(() => {
    setquestion((x) => []);
  }, [newChat]);

  useEffect(() => {
    // Scroll to the end of the div
    if (containerRef.current)
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [question]);
  return (
    <div className="w-full flex flex-col h-[100vh]">
      {question.length > 0 ? (
        <>
          <div
            ref={containerRef}
            className="flex-grow overflow-y-scroll flex flex-col no-scrollbar mx-auto p-2 md:p-6 w-[98%] md:w-[80%] ">
            {question.map((ques, index) => {
              return (
                <>
                  <Reply question={ques} key={index} />
                </>
              );
            })}
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
            ref={inputRef}
            className="flex-grow  rounded p-4 resize-none outline-none text-sm"
            id="textBox"
            cols="10"
            rows="4"
            placeholder="Start your question"
            value={askQuestion}
            onChange={(e) => {
              setaskQuestion(e.target.value);
              // clearInput();
            }}
            onKeyDown={(e) => handleKeyPress(e)}></textarea>
          <div
            className="text-gray-300 p-2"
            onClick={() => {
              askQuestion.length > 0 && setquestion((x) => [...x, askQuestion]);
            }}>
            <LuSendHorizonal size={36} />
          </div>
        </div>
      </div>
    </div>
  );
}
