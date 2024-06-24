import React, { useEffect, useState } from "react";
import { BsPersonVideo } from "react-icons/bs";
import { IoIosLink } from "react-icons/io";
import { RiDoubleQuotesL } from "react-icons/ri";
import {
  IoCopyOutline,
  IoReload,
  IoThumbsDown,
  IoThumbsDownOutline,
} from "react-icons/io5";
import { GoArrowUpRight } from "react-icons/go";
import { FaSpinner } from "react-icons/fa";
import Feedback from "../../feedback/Feedback";

export default function Reply({
  question = "What the user asked?",
  reply = [
    {
      text: "Ad magna veniam esse est cupidatat laboris non cillum exercitation laborum eu eiusmod ullamco id. Ipsum ullamco aliqua commodo commodo do do sint ea mollit labore pariatur. Eiusmod esse irure ut veniam laborum officia enim reprehenderit aute sit.",
      link: "",
      heading: "This is section 1 heading",
    },
    {
      text: "Quis qui magna ut ex. Excepteur consectetur cillum aliqua enim eu aliquip minim. Id consequat enim consectetur cillum enim proident anim culpa voluptate. Tempor excepteur cupidatat sunt occaecat do duis excepteur consectetur sit nostrud ullamco. Duis cillum tempor ad minim cupidatat officia esse magna nisi fugiat nostrud. Amet et reprehenderit qui consequat eu tempor velit id ipsum in ut ullamco commodo. In anim eiusmod magna et cupidatat voluptate tempor est enim esse est.",
      link: "",
      heading: "This is section 1 heading",
    },
  ],
  refrences = [
    {
      text: "Ad magna veniam esse est cupidatat laboris non cillum exercitation laborum eu eiusmod ullamco id. Ipsum ullamco aliqua commodo commodo do do sint ea mollit labore pariatur. Eiusmod esse irure ut veniam laborum officia enim reprehenderit aute sit.",
      link: "",
      heading: "Page 199 of satya Sai Baba speaks :Volume III",
    },
    {
      text: "Quis qui magna ut ex. Excepteur consectetur cillum aliqua enim eu aliquip minim. Id consequat enim consectetur cillum enim proident anim culpa voluptate. Tempor excepteur cupidatat sunt occaecat do duis excepteur consectetur sit nostrud ullamco. Duis cillum tempor ad minim cupidatat officia esse magna nisi fugiat nostrud. Amet et reprehenderit qui consequat eu tempor velit id ipsum in ut ullamco commodo. In anim eiusmod magna et cupidatat voluptate tempor est enim esse est.",
      link: "",
      heading: "Page 199 of satya Sai Baba speaks :Volume III",
    },
  ],
}) {
  const [fetchReply, setfetchReply] = React.useState(false);
  const [showFeedbackModal, setshowFeedbackModal] = useState(false);

  const fetchingReply = () => {
    // setquestion((x) => [...x, askQuestion]);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 2000);
    });
  };

  const fetchReplyData = async () => {
    try {
      const reply = await fetchingReply();
      setfetchReply(() => reply.success);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchReplyData();
  }, []);
  return (
    <div className="  w-full  text-gray-500 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-orange-400">
          <BsPersonVideo size={24} />
        </span>
        <span className="text-base">{question}</span>
      </div>
      {!fetchReply ? (
        <>
          <div className="flex animate-spin items-center justify-center w-24 h-24 mx-auto mt-12 text-orange-400">
            <FaSpinner size={24} />
          </div>
        </>
      ) : (
        <>
          <div className=" p-2 md:p-6 ">
            <div className="border-l border-orange-400 p-2 px-4 flex flex-col">
              <span className="text-orange-400">
                <RiDoubleQuotesL size={24} />
              </span>
              <div className="px-4 flex items-end font-thin gap-1">
                <div className="flex-flex-col gap-2 flex-grow">
                  {reply.map((item, index) => {
                    return (
                      <div key={index} className=" ">
                        <h2 className=" font-bold my-2 text-gray-600 text-base">
                          {item.heading ? item.heading : ""}
                        </h2>
                        <p className="text-base">
                          {item.text ? item.text : ""}{" "}
                          <a
                            className=" text-base text-orange-400"
                            href="http://somewebsite.com"
                          >
                            [{index}]
                          </a>{" "}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className=" border-l border-orange-400 flex-shrink-0 py-2 px-2 flex flex-col gap-4 text-orange-400">
                  <IoIosLink size={20} className="cursor-pointer" />
                  <IoReload size={18} className="cursor-pointer" />
                  <IoCopyOutline size={18} className="cursor-pointer" />
                  <div onClick={() => setshowFeedbackModal(true)}>
                    <IoThumbsDownOutline size={18} className="cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
            <div className="  p-2  flex flex-col ">
              <div className="px-4 flex font-thin gap-1 ">
                <div className="flex-flex-col gap-2  bg-orange-50 rounded p-2 flex-grow">
                  {refrences.map((item, index) => {
                    return (
                      <div key={index} className=" text-gray-700 ">
                        <h2 className=" flex gap-2 my-2 text-gray-600 font-semibold text-base">
                          <a
                            className=" text-base text-orange-400"
                            href="http://somewebsite.com"
                          >
                            [{index}]
                          </a>
                          {item.heading ? item.heading : ""}
                        </h2>
                        <p className="border-l-2 border-dotted p-2 ml-3 border-orange-400 text-base">
                          {item.text.length > 200
                            ? item.text.slice(0, 200) + "..."
                            : item.text
                            ? item.text
                            : ""}{" "}
                          <a
                            className="  text-orange-400 flex  items-center gap-1"
                            href="http://somewebsite.com"
                          >
                            see more <GoArrowUpRight size={20} />
                          </a>
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex-grow w-20"></div>
              </div>
            </div>
          </div>
        </>
      )}
      {showFeedbackModal ? (
        <>
          <div className="absolute top-0 bottom-0 right-0 left-0 flex justify-center items-center bg-black bg-opacity-20 z-50">
            <Feedback
              closeModalCallback={() => setshowFeedbackModal(false)}
              options={[
                "Not helpful",
                "Inaccurate",
                "Out of date",
                "Problematic",
                "Misquoted the orignal source",
              ]}
            />
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
