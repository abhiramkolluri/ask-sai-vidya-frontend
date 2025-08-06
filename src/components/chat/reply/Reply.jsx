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
import { apiRoute, submitFeedback } from "../../../helpers/apiRoute";

import Feedback from "../../feedback/Feedback";

async function askSaiBaba(question) {
    try {
        const url = apiRoute("query");
        console.log("Query URL:", url);
        console.log("Environment variable:", process.env.REACT_APP_BASE_API_SERVER);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: question
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            return data.response;
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

const fetchCitations = async (question) => {
  try {
    const url = apiRoute("search");
    console.log("Search URL:", url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: question })
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error fetching citations:', error);
    return []; // Return empty array if citations fetch fails
  }
};

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
  const [feedbackType, setFeedbackType] = useState(null); // 'up' or 'down'
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    try {
      setIsReloading(true);
      onReloadClick(question);
    } catch (error) {
      console.error('Error reloading response:', error);
      alert('Failed to reload response. Please try again.');
    } finally {
      setIsReloading(false);
    }
  };

  const handleSeeMore = (event) => {
    // Code to handle the click event goes here
    event.preventDefault(); // Stop the default navigation

    // Open the link in a new tab with desired features (optional)
    window.open(event.target.href, "_blank", "noopener,noreferrer");
  };

  const handleFeedbackClick = (type) => {
    setFeedbackType(type);
    setshowFeedbackModal(true);
  };

  const handleFeedback = async (type, reason, additionalComments = '') => {
    try {
      const feedbackData = {
        question,
        answer: reply.primaryResponse,
        feedbackType: type,
        reason,
        additionalComments,
        timestamp: new Date().toISOString(),
        citations: reply.citations || []
      };
      console.log('Feedback data being sent:', feedbackData);
      await submitFeedback(feedbackData);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
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
          <div className="px-2 py-1 flex items-end mb-2">
            <div className="">
              <p className="text-lg font-normal text-[#252525]">
                Here are some discourses where you can start learning about the topic:
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
              onClick={() => handleFeedbackClick('up')}
            />
            <IoThumbsDownOutline
              size={20}
              className="cursor-pointer"
              onClick={() => handleFeedbackClick('down')}
            />
            {isReloading ? (
              <div className="animate-spin">
                <FaSpinner size={20} />
              </div>
            ) : (
              <IoReload
                size={20}
                className="cursor-pointer"
                onClick={handleReload}
              />
            )}
          </div>
        </div>
      </div>
      {showFeedbackModal ? (
        <>
          <div className="absolute top-0 bottom-0 right-0 left-0 flex justify-center items-center bg-black bg-opacity-20 z-50">
            <Feedback
              closeModalCallback={() => {
                setshowFeedbackModal(false);
                setFeedbackType(null);
              }}
              options={
                feedbackType === 'up'
                  ? [
                      "Helpful",
                      "Accurate Information",
                      "Clear Explanation",
                      "Good Sources",
                      "Answered the question well",
                    ]
                  : [
                      "Not helpful",
                      "Inaccurate",
                      "Out of date",
                      "Problematic",
                      "Misquoted the original source",
                    ]
              }
              question={
                feedbackType === 'up'
                  ? "What did you like about this response?"
                  : "What could be improved about this response?"
              }
              onSubmit={(reason, additionalComments) => handleFeedback(feedbackType, reason, additionalComments)}
            />
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
