import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../logo/Logo";
import { IoMdSearch } from "react-icons/io";
import { FaSpinner } from "react-icons/fa";
import { IoChevronDown, IoChevronUp, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { BsBookmarkFill, BsTrash, BsBookmarkStarFill } from "react-icons/bs";
import { GoArrowUpRight } from "react-icons/go";
import ChatSection from "../chat/chatSection/ChatSection";

export default function SideNav({
  threads = [],
  startNewChatCallback = () => { },
  onChatSelect = () => { },
  onDeleteChat = () => { },
  loading = false,
  savedDiscourses = [],
  loadingSaved = false,
  onDeleteSavedDiscourse = () => { },
}) {
  const [sectionData, setSectionData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [chatHistoryOpen, setChatHistoryOpen] = useState(true);
  const [savedDiscoursesOpen, setSavedDiscoursesOpen] = useState(false);
  const [selectedDiscourse, setSelectedDiscourse] = useState(null);

  useEffect(() => {
    const groupedThreads = threads.reduce((acc, thread) => {
      const date = new Date(thread.timestamp);
      const key = `${date.getMonth() + 1}-${date.getFullYear()}`;

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(thread);

      return acc;
    }, {});

    // Sort threads within each section by timestamp in descending order
    for (const key in groupedThreads) {
      groupedThreads[key].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );
    }

    // Sort sections by timestamp in descending order
    const sortedSectionData = Object.keys(groupedThreads)
      .sort((a, b) => {
        const [aMonth, aYear] = a.split("-");
        const [bMonth, bYear] = b.split("-");
        const aDate = new Date(aYear, aMonth - 1);
        const bDate = new Date(bYear, bMonth - 1);
        return bDate - aDate;
      })
      .reduce((acc, key) => {
        acc[key] = groupedThreads[key];
        return acc;
      }, {});

    setSectionData(sortedSectionData);
  }, [threads]);

  const filteredThreads = (threads) => {
    if (!searchQuery) return threads;
    return threads.filter((thread) =>
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const handleViewDiscourse = (discourse) => {
    setSelectedDiscourse(discourse);
  };

  const handleCloseDiscourseModal = () => {
    setSelectedDiscourse(null);
  };

  const handleDeleteDiscourse = async (discourseId) => {
    if (window.confirm('Are you sure you want to remove this from saved discourses?')) {
      await onDeleteSavedDiscourse(discourseId);
      if (selectedDiscourse && selectedDiscourse.id === discourseId) {
        setSelectedDiscourse(null);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 p-4 text-sm h-[100vh] z-50 bg-white dark:bg-gray-800">
      <div>
        <Logo />
      </div>
      <div className="w-full border rounded border-[#BC5B01] dark:border-orange-600 flex gap-2 justify-center items-center bg-white dark:bg-gray-700">
        <div className="ml-2 text-[#BC5B01] dark:text-orange-400">
          <IoMdSearch size={20} />
        </div>
        <input
          type="text"
          placeholder="Search"
          className="w-full p-2 outline-none -ml-2 bg-transparent dark:text-gray-200 dark:placeholder-gray-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 flex-grow overflow-y-scroll no-scrollbar">
        {/* Chat History Accordion */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setChatHistoryOpen(!chatHistoryOpen)}
            className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <span className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <IoChatbubbleEllipsesOutline size={20} className="text-primary dark:text-orange-400" />
              Chat History ({threads.length})
            </span>
            {chatHistoryOpen ? <IoChevronUp size={20} className="dark:text-gray-300" /> : <IoChevronDown size={20} className="dark:text-gray-300" />}
          </button>

          {chatHistoryOpen && (
            <div className="py-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-orange-400" size={24} />
                  <span className="ml-2 text-gray-500 dark:text-gray-400">Loading chats...</span>
                </div>
              ) : Object.keys(sectionData).length > 0 ? (
                Object.keys(sectionData).map((key) => (
                  <ChatSection
                    key={key}
                    monthYear={key}
                    threads={filteredThreads(sectionData[key])}
                    onChatSelect={onChatSelect}
                    onDeleteChat={onDeleteChat}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <span>No chats yet</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Saved Discourses Accordion */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSavedDiscoursesOpen(!savedDiscoursesOpen)}
            className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <span className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <BsBookmarkStarFill size={18} className="text-primary dark:text-orange-400" />
              Saved Discourses ({savedDiscourses.length})
            </span>
            {savedDiscoursesOpen ? <IoChevronUp size={20} className="dark:text-gray-300" /> : <IoChevronDown size={20} className="dark:text-gray-300" />}
          </button>

          {savedDiscoursesOpen && (
            <div className="py-2">
              {loadingSaved ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-orange-400" size={24} />
                  <span className="ml-2 text-gray-500 dark:text-gray-400">Loading...</span>
                </div>
              ) : savedDiscourses.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {savedDiscourses.map((saved) => (
                    <div
                      key={saved.id}
                      className="p-2 hover:bg-orange-50 dark:hover:bg-gray-700 rounded cursor-pointer border border-transparent hover:border-orange-300 dark:hover:border-orange-600 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => handleViewDiscourse(saved)}
                        >
                          <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                            {saved.discourse.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            From: "{saved.question_context}"
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(saved.saved_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDiscourse(saved.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          title="Remove from saved"
                        >
                          <BsTrash size={14} className="text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400 text-center px-2">
                  <BsBookmarkFill size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                  <span className="text-xs">No saved discourses yet</span>
                  <span className="text-xs mt-1">Click the bookmark icon on any discourse to save it</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <div
          onClick={() => startNewChatCallback()}
          className="bg-[#BC5B01] dark:bg-orange-600 text-white flex items-center justify-center font-bold text-lg w-full py-4 px-2 rounded cursor-pointer hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors">
          <p className="ml-2 text-base">Ask a new question</p>
        </div>
      </div>

      {/* Modal for viewing saved discourse */}
      {selectedDiscourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {selectedDiscourse.discourse.title}
              </h2>
              <button
                onClick={handleCloseDiscourseModal}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 bg-orange-50 dark:bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>You discovered this while asking:</strong>
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200 italic mt-1">
                  "{selectedDiscourse.question_context}"
                </p>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedDiscourse.discourse.content}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong>Source:</strong> {selectedDiscourse.discourse.source_citation}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Saved on {new Date(selectedDiscourse.saved_at).toLocaleString()}
                </p>
              </div>

              {/* View Full Discourse Button */}
              {selectedDiscourse.discourse.source_url && (
                <div className="mt-4">
                  <Link
                    to={selectedDiscourse.discourse.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary dark:bg-orange-600 text-white rounded hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors"
                    onClick={handleCloseDiscourseModal}
                  >
                    View Full Discourse
                    <GoArrowUpRight size={18} />
                  </Link>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between">
              <button
                onClick={() => handleDeleteDiscourse(selectedDiscourse.id)}
                className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
              >
                Remove from Saved
              </button>
              <button
                onClick={handleCloseDiscourseModal}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
