import React, { useState, useEffect, useRef } from "react";
import { RiSendPlane2Fill, RiSendPlane2Line } from "react-icons/ri";
import SampleQuestions from "../sample/SampleQuestions";
import Reply from "../chat/reply/Reply";
import { apiRoute } from "../../helpers/apiRoute";

const cache = {};

export default function ChatBox({
  newChat,
  // loggedin = false,
  // modalCallback = () => {},
  selectedThreadId = null,
  addThread = () => {},
  threads = [],
}) {
  const [messages, setMessages] = useState([]);
  const [askQuestion, setAskQuestion] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(null); // Track loading for specific question
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const fetchPrimaryResponse = async (question) => {
    if (cache[question]?.primaryResponse) {
      return {
        response: cache[question].primaryResponse,
        fetchCitations: cache[question].fetchCitations,
      };
    }
    const response = await fetch(apiRoute("query"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: question }),
    });
    const data = await response.json();
    const fetchCitations =
      data.response !==
      "It seems like there might be a misunderstanding with the question you provided. I'm here to offer spiritual guidance based on the teachings of Sathya Sai Baba. If you have any questions related to spirituality, personal growth, or Sai Baba's teachings, feel free to ask!";
    cache[question] = {
      ...cache[question],
      primaryResponse: data.response,
      fetchCitations,
    };
    return { response: data.response, fetchCitations };
  };

  const fetchCitations = async (question) => {
    if (cache[question]?.citations) {
      return cache[question].citations;
    }
    const response = await fetch(apiRoute("search"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: question }),
    });
    const data_citations = await response.json();
    cache[question] = { ...cache[question], citations: data_citations };
    return data_citations; // Ensure this matches your actual API response structure
  };

  const handleSend = async (question = null) => {
    const val = question || inputRef.current.value.trim();
    if (val.length > 0) {
      setAskQuestion("");
      inputRef.current.value = "";

      const newIndex = messages.length;
      const updatedMessages = [...messages, { question: val, reply: null }];
      setMessages(updatedMessages);
      setLoadingIndex(newIndex); // Set loading index for the new question

      try {
        const primaryResponsePromise = fetchPrimaryResponse(val);
        const citationsPromise = primaryResponsePromise.then((result) => {
          if (result.fetchCitations) {
            return fetchCitations(val);
          }
          return [];
        });

        const [primaryResponse, citations] = await Promise.all([
          primaryResponsePromise,
          citationsPromise,
        ]);

        // Update state once with both responses
        const finalMessages = updatedMessages.map((q, index) =>
          index === newIndex
            ? {
                ...q,
                reply: {
                  primaryResponse: primaryResponse.response,
                  citations,
                },
              }
            : q,
        );
        setMessages(finalMessages);

        // Update the current thread with new messages
        const existingThread = threads.find(
          (thread) => thread.id === selectedThreadId,
        );
        const newThread = {
          id: selectedThreadId || new Date().toISOString(),
          title:
            existingThread && existingThread.title ? existingThread.title : val,
          timestamp: existingThread ? existingThread.timestamp : new Date(),
          messages: finalMessages,
        };

        addThread(newThread);
        // navigate(`/thread/${newThread.id}`);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingIndex(null); // Reset loading index
      }
    }
  };

  const handleKeyPress = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await handleSend();
    }
  };

  useEffect(() => {
    if (containerRef.current)
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (newChat) {
      setMessages([]);
      // navigate("/");
    }
  }, [newChat]);

  useEffect(() => {
    if (selectedThreadId) {
      const selectedThread = threads.find(
        (thread) => thread.id === selectedThreadId,
      );
      if (selectedThread) {
        setMessages(selectedThread.messages);
        // navigate(`/thread/${selectedThreadId}`);
      }
    }
  }, [selectedThreadId]);

  const handleSampleQuestionClick = async (question) => {
    await handleSend(question);
  };

  const handleLinkClick = (question) => {
    const url = `${window.location.origin}/thread/${selectedThreadId}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const handleReloadClick = (question) => {
    // Handle reload logic here
    alert(`Reloading chat for question: ${question}`);
  };

  const handleCopyClick = (text) => {
    navigator.clipboard.writeText(text);
    alert("Response text copied to clipboard!");
  };

  const SendIcon = askQuestion.length ? RiSendPlane2Fill : RiSendPlane2Line;

  return (
    <div className="w-full flex flex-col h-[100vh] mt-16">
      {messages.length > 0 ? (
        <div
          ref={containerRef}
          className="flex-grow overflow-y-scroll flex flex-col no-scrollbar mx-4 p-3 md:p-4 w-[98%] md:w-[90%] ">
          {messages.map((msg, index) => (
            <Reply
              key={index}
              question={msg.question}
              reply={msg.reply}
              loading={loadingIndex === index}
              onLinkClick={handleLinkClick}
              onReloadClick={handleReloadClick}
              onCopyClick={handleCopyClick}
            />
          ))}
        </div>
      ) : (
        <div className="flex-grow overflow-y-scroll flex justify-center items-center">
          <div className="flex flex-col w-8/12 items-center justify-center gap-4">
            <p className="p-2 text-gray-500 font-light text-justify min-w-[350px] text-xl">
              Ask your question to&nbsp;<b>Sai Vidya</b> and discover profound
              wisdom!
            </p>
            <div>
              <SampleQuestions onQuestionClick={handleSampleQuestionClick} />
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-8">
        <div className="flex justify-center items-center border border-[#C2C2C2] gap-2 rounded h-[70px] p-4">
          <textarea
            ref={inputRef}
            className="flex-grow rounded pt-3 resize-none outline-none text-lg min-h-[60px]"
            id="textBox"
            cols="10"
            rows="2"
            placeholder="Ask a question"
            onKeyDown={handleKeyPress}
          />
          <div className="text-gray-300 p-2">
            <SendIcon
              className="cursor-pointer hover:shadow-lg"
              onClick={() => handleSend()}
              size={24}
              color="#BC5B01"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
