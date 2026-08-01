import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../logo/Logo";
import { IoMdSearch } from "react-icons/io";
import { FaSpinner } from "react-icons/fa";
import { IoChevronDown, IoChevronUp, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { BsBookmarkFill, BsTrash, BsBookmarkStarFill } from "react-icons/bs";
import { MdOutlineAutoStories } from "react-icons/md";
import { GoArrowUpRight } from "react-icons/go";
import ChatSection from "../chat/chatSection/ChatSection";
import SavedDiscourseModal from "../savedDiscourse/SavedDiscourseModal";
import { useSavedDiscourses } from "../../contexts/SavedDiscoursesContext";
import { formatCollection } from "../../helpers/formatCollection";

// Saved titles are stored as `Title of "Collection"`; split so we can show the
// discourse title above and its source below.
function splitSavedTitle(full) {
  const m = (full || "").match(/^(.*?) of "(.*)"$/);
  return m ? { title: m[1], source: m[2] } : { title: full, source: "" };
}

export default function SideNav({
  threads = [],
  startNewChatCallback = () => { },
  onChatSelect = () => { },
  onDeleteChat = () => { },
  loading = false,
  onClose = () => { },
}) {
  const {
    bookmarkedDiscourses,
    annotatedDiscourses,
    loadingSaved,
    removeBookmark,
    clearAnnotations,
  } = useSavedDiscourses();

  const [sectionData, setSectionData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [chatHistoryOpen, setChatHistoryOpen] = useState(true); // Expanded by default
  const [savedDiscoursesOpen, setSavedDiscoursesOpen] = useState(true); // Expanded by default
  const [annotationsOpen, setAnnotationsOpen] = useState(false);
  const [selectedSavedDiscourse, setSelectedSavedDiscourse] = useState(null);
  const [selectedAnnotatedDiscourse, setSelectedAnnotatedDiscourse] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedDiscourse, setSelectedDiscourse] = useState(null);
  const [discourseToDelete, setDiscourseToDelete] = useState(null); // For delete confirmation modal

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

    for (const key in groupedThreads) {
      groupedThreads[key].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );
    }

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

  const filteredThreads = (threadList) => {
    if (!searchQuery) return threadList;
    return threadList.filter((thread) =>
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const confirmPendingAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === "bookmark") {
      await removeBookmark(pendingAction.id);
      if (selectedSavedDiscourse?.id === pendingAction.id) {
        setSelectedSavedDiscourse(null);
      }
    } else if (pendingAction.type === "annotations") {
      await clearAnnotations(pendingAction.id);
      if (selectedAnnotatedDiscourse?.id === pendingAction.id) {
        setSelectedAnnotatedDiscourse(null);
      }
    }

    setPendingAction(null);
  };

  const handleChatSelect = (threadId) => {
    onChatSelect(threadId);
    onClose();
  };

  const handleStartNewChat = () => {
    startNewChatCallback();
    onClose();
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 text-sm h-full min-h-0 z-50 bg-[#FFFBF8] md:bg-[#FFFBF8]">
      <div className="mb-1">
        <Logo />
      </div>

      <div className="w-full rounded-full border border-orange-200/70 bg-white flex items-center gap-2 pl-3 pr-3 py-0.5 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <IoMdSearch size={18} className="text-primary shrink-0" />
        <input
          type="text"
          placeholder="Find past questions and saved discourses"
          className="w-full py-2.5 outline-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mt-2 flex flex-col gap-1 flex-grow overflow-y-scroll no-scrollbar">
        {/* Chat History Accordion */}
        <div className="border-b border-orange-100/80">
          <button
            onClick={() => setChatHistoryOpen(!chatHistoryOpen)}
            className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-orange-50/60 rounded-lg transition-colors"
          >
            <span className="font-semibold text-sm text-gray-800 flex items-center gap-2">
              <IoChatbubbleEllipsesOutline size={18} className="text-primary" />
              Question History ({threads.length})
            </span>
            {chatHistoryOpen ? <IoChevronUp size={20} /> : <IoChevronDown size={20} />}
          </button>

          {chatHistoryOpen && (
            <div className="py-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-orange-400" size={24} />
                  <span className="ml-2 text-gray-800">Loading chats...</span>
                </div>
              ) : Object.keys(sectionData).length > 0 ? (
                Object.keys(sectionData).map((key) => (
                  <ChatSection
                    key={key}
                    monthYear={key}
                    threads={filteredThreads(sectionData[key])}
                    onChatSelect={handleChatSelect}
                    onDeleteChat={onDeleteChat}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-800 text-sm">
                  <span>No chats yet</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Saved Discourses Accordion */}
        <div className="border-b border-orange-100/80">
          <button
            onClick={() => setSavedDiscoursesOpen(!savedDiscoursesOpen)}
            className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-orange-50/60 rounded-lg transition-colors"
          >
            <span className="font-semibold text-sm text-gray-800 flex items-center gap-2">
              <BsBookmarkStarFill size={18} className="text-primary" />
              Saved Discourses ({bookmarkedDiscourses.length})
            </span>
            {savedDiscoursesOpen ? <IoChevronUp size={20} /> : <IoChevronDown size={20} />}
          </button>

          {savedDiscoursesOpen && (
            <div className="py-2">
              {loadingSaved ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-orange-400" size={24} />
                  <span className="ml-2 text-gray-800">Loading...</span>
                </div>
              ) : bookmarkedDiscourses.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {bookmarkedDiscourses.map((saved) => (
                    <div
                      key={saved.id}
                      className="p-2.5 hover:bg-orange-50/70 rounded-lg cursor-pointer border border-transparent hover:border-orange-200/60 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => setSelectedSavedDiscourse(saved)}
                        >
                          <p className="font-bold text-gray-900 text-sm truncate flex items-center gap-2">
                            {splitSavedTitle(saved.discourse.title).title}
                            {saved.discourse.highlights && saved.discourse.highlights.length > 0 && (
                              <span className="inline-flex items-center justify-center bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                {saved.discourse.highlights.length} ✨
                              </span>
                            )}
                          </p>
                          {splitSavedTitle(saved.discourse.title).source && (
                            <p className="text-sm text-gray-600 truncate">
                              {formatCollection(splitSavedTitle(saved.discourse.title).source)}
                            </p>
                          )}
                          <p className="text-sm text-gray-800 mt-1 truncate">
                            From: "{saved.question_context}"
                          </p>
                          <p className="text-sm text-gray-800 mt-1">
                            {new Date(saved.saved_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingAction({ type: "bookmark", id: saved.id });
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                          title="Remove bookmark"
                        >
                          <BsTrash size={14} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-800 text-center px-2">
                  <BsBookmarkFill size={32} className="text-primary/40 mb-2" />
                  <span className="text-sm">No saved discourses yet</span>
                  <span className="text-xs mt-1">Click the bookmark icon on any discourse to save it</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Annotations Accordion */}
        <div className="border-b border-orange-100/80">
          <button
            onClick={() => setAnnotationsOpen(!annotationsOpen)}
            className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-orange-50/60 rounded-lg transition-colors"
          >
            <span className="font-semibold text-sm text-gray-800 flex items-center gap-2">
              <MdOutlineAutoStories size={18} className="text-primary" />
              Highlights & Notes ({annotatedDiscourses.length})
            </span>
            {annotationsOpen ? <IoChevronUp size={20} /> : <IoChevronDown size={20} />}
          </button>

          {annotationsOpen && (
            <div className="py-2">
              {loadingSaved ? (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-orange-400" size={24} />
                  <span className="ml-2 text-gray-500">Loading...</span>
                </div>
              ) : annotatedDiscourses.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {annotatedDiscourses.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 hover:bg-orange-50/70 rounded-lg cursor-pointer border border-transparent hover:border-orange-200/60 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {item.discourse.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {item.discourse.source_url && (
                              <Link
                                to={item.discourse.source_url}
                                onClick={onClose}
                                className="inline-flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                              >
                                Open discourse
                                <GoArrowUpRight size={12} />
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedAnnotatedDiscourse(item)}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700"
                            >
                              Quick view
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => setPendingAction({ type: "annotations", id: item.id })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                          title="Remove all annotations"
                        >
                          <BsTrash size={14} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-center px-2">
                  <MdOutlineAutoStories size={28} className="text-orange-300 mb-2" />
                  <span className="text-xs">No highlights or comments yet</span>
                  <span className="text-xs mt-1">Select text in a discourse to annotate it</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleStartNewChat}
          className="w-full rounded-full bg-primary text-white flex items-center justify-center py-3 px-4 text-sm font-semibold shadow-md hover:bg-orange-600 active:scale-[0.98] transition-all"
        >
          Ask a new question
        </button>
      </div>

      <SavedDiscourseModal
        discourse={selectedSavedDiscourse}
        variant="saved"
        onClose={() => setSelectedSavedDiscourse(null)}
        onRemove={(id) => setPendingAction({ type: "bookmark", id })}
      />

      <SavedDiscourseModal
        discourse={selectedAnnotatedDiscourse}
        variant="annotations"
        onClose={() => setSelectedAnnotatedDiscourse(null)}
        onRemove={(id) => setPendingAction({ type: "annotations", id })}
      />

      {pendingAction && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4"
          onClick={() => setPendingAction(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn border border-orange-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
              <h3 className="text-base font-semibold text-gray-800">
                {pendingAction.type === "bookmark"
                  ? "Remove from Saved?"
                  : "Remove All Annotations?"}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
                {pendingAction.type === "bookmark"
                  ? "This removes the bookmark. Your highlights and comments will be kept if you have any."
                  : "This removes all highlights and comments for this discourse. The bookmark will be kept if you saved it."}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setPendingAction(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPendingAction}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
