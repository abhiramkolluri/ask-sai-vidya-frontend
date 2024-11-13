import React, { useState } from "react";
import {
  IoCopyOutline,
  IoReload,
  IoLinkOutline,
  IoThumbsDownOutline,
  IoThumbsUpOutline,
} from "react-icons/io5";
import { GoArrowUpRight } from "react-icons/go";
import { FaSpinner } from "react-icons/fa";
import { Link } from "react-router-dom";

import Feedback from "../../feedback/Feedback";

export default function Reply({
  question = "What the user asked?",
  reply,
  loading,
  onLinkClick,
  onReloadClick,
  onCopyClick,
}) {
  console.log("Reply component received reply:", reply);
  const [showFeedbackModal, setshowFeedbackModal] = useState(false);

  const handleSeeMore = (event) => {
    // Code to handle the click event goes here
    event.preventDefault(); // Stop the default navigation

    // Open the link in a new tab with desired features (optional)
    window.open(event.target.href, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="w-full text-gray-500 text-sm">
        <div className="flex justify-end">
          <div className="bg-[#f5f5f5] px-6 py-4 md:w-3/4 rounded">
            <span className="text-[#252525] text-lg">{question}</span>
          </div>
        </div>
        <div className="flex animate-spin items-center justify-center w-24 h-24 mx-auto mt-12 text-orange-400">
          <FaSpinner size={24} />
        </div>
      </div>
    );
  }

  if (!reply) {
    return (
      <div className="flex justify-end">
        <div className="bg-[#f5f5f5] px-6 py-4 md:w-3/4 rounded">
          <span className="text-[#252525] text-lg">{question}</span>
        </div>
      </div>
    );
  }

  const { primaryResponse = "", citations = [] } = reply;

  return (
    <div className="w-full mx-2">
      <div className="flex justify-end">
        <div className="bg-[#f5f5f5] px-6 py-4 md:w-3/4 rounded">
          <span className="text-[#252525] text-lg">{question}</span>
        </div>
      </div>

      <div className="md:p-1 mx-2">
        <div className="border-l border-primary p-2 px-4 flex flex-col">
          <div className="px-2 py-1 flex items-end">
            <div className=" ">
              <p className="text-lg font-normal text-[#252525]">
                {primaryResponse}
              </p>
            </div>
          </div>

          <div className="m-2 flex flex-col bg-[#FEF4EB] rounded ">
            <div className="mx-1 flex">
              <div className="p-6">
                {citations.length > 0 ? (
                  citations.map((item, index) => (
                    <div key={index} className="text-[#252525]">
                      <p className="">
                        <span className="text-primary">
                          [{index + 1}] {"\t\t"}
                        </span>
                        <span className="font-lg font-bold ">
                          {item.title} of "{item.collection}"
                        </span>
                      </p>
                      <p className="italic">{item.date}</p>
                      <p className="p-2 ml-3">
                        {item.content.length > 200
                          ? item.content.slice(0, 200) + "..."
                          : item.content}{" "}
                        <br />
                        <span className="text-primary underline">
                          <Link
                            to={`/blog/${item._id}`}
                            state={{ citations }}
                            className="flex"
                            onClick={handleSeeMore}
                            // target="_blank"
                          >
                            See more
                            <GoArrowUpRight size={20} />
                          </Link>
                        </span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No citations found.</p>
                )}
              </div>
              <div className="flex-grow w-20"></div>
            </div>
          </div>
          <div className="flex-shrink-0 py-2 px-2 flex gap-4 text-primary">
            <IoCopyOutline
              size={20}
              className="cursor-pointer"
              onClick={() => onCopyClick(primaryResponse)}
            />
            <IoLinkOutline
              size={20}
              className="cursor-pointer"
              onClick={() => onLinkClick(question)}
            />
            <IoThumbsUpOutline
              size={20}
              className="cursor-pointer"
              onClick={() => setshowFeedbackModal(true)}
            />
            <IoThumbsDownOutline
              size={20}
              className="cursor-pointer"
              onClick={() => setshowFeedbackModal(true)}
            />
            <IoReload
              size={20}
              className="cursor-pointer"
              onClick={() => onReloadClick(question)}
            />
          </div>
        </div>
      </div>
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
