import React, { useEffect, useState, useRef } from "react";
import { LuPencilLine } from "react-icons/lu";
import { IoCalendar } from "react-icons/io5";
import { useQuery } from "react-query";
import { IoMdList } from "react-icons/io";
import { MdClose } from "react-icons/md";
import { TbLayoutSidebarRightExpand } from "react-icons/tb";
import { Link, useLocation, useParams } from "react-router-dom";

import bgflower from "../../images/bgflower.png";
import Logo from "../../components/logo/Logo";
import { fetchBlogPost } from "../../helpers/apiRoute";
import ErrorPage from "../../components/error/ErrorPage";
import Navbar from "../../components/Navbar";
import TextHighlightPopover from "../../components/chat/TextHighlightPopover";
import { useAuth } from "../../contexts/AuthContext";
import { useSavedDiscourses } from "../../contexts/SavedDiscoursesContext";

export default function Blog() {
  const { slugId } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();

  // Use saved discourses from context
  const {
    savedDiscourses,
    saveDiscourse,
    updateSavedDiscourse,
    unsaveDiscourse,
    getSavedDiscourseByTitle
  } = useSavedDiscourses();

  // Citations drawer
  const [citationsOpen, setCitationsOpen] = useState(false);

  const citations = state?.citations?.length
    ? state.citations
    : JSON.parse(sessionStorage.getItem("blog-citations") || "null") || [];

  useEffect(() => {
    if (state?.citations?.length) {
      sessionStorage.setItem("blog-citations", JSON.stringify(state.citations));
    }
  }, [state]);

  // Highlighting state
  const [showHighlightPopover, setShowHighlightPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [activeHighlightId, setActiveHighlightId] = useState(null);
  const contentRef = useRef(null);

  const { isLoading, isRefetching, data, isError, refetch } = useQuery(
    "blogPost",
    () => fetchBlogPost(slugId),
    {
      retry: false,
    },
  );

  useEffect(() => {
    refetch();
  }, [slugId, refetch]);

  // Load saved discourse highlights for this blog post
  useEffect(() => {
    if (data && savedDiscourses.length > 0) {
      const discourseTitle = `${data.title} of "${data.collection}"`;
      const savedDiscourse = getSavedDiscourseByTitle(discourseTitle);

      if (savedDiscourse && savedDiscourse.discourse.highlights) {
        setHighlights(savedDiscourse.discourse.highlights);
      } else {
        setHighlights([]);
      }
    }
  }, [data, savedDiscourses, getSavedDiscourseByTitle]);

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0 && user && user.token) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Get content container to position popover in the right margin
      const contentContainer = contentRef.current;
      if (!contentContainer) return;

      const containerRect = contentContainer.getBoundingClientRect();

      // Position the popover in the right margin, aligned with the selection
      // Place it to the right of the content area
      setPopoverPosition({
        x: containerRect.right + 20, // 20px margin from the right edge of content
        y: rect.top, // Align with the top of the selection (no need for scrollY, using fixed positioning)
      });

      setSelectedText(selectedText);
      setShowHighlightPopover(true);
    } else {
      setShowHighlightPopover(false);
    }
  };

  // Hide popover on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showHighlightPopover) {
        setShowHighlightPopover(false);
        window.getSelection().removeAllRanges();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showHighlightPopover]);

  // Handle highlight action
  const handleHighlight = async () => {
    if (!selectedText || !user || !data) return;

    const highlightId = Date.now().toString();
    const newHighlight = {
      id: highlightId,
      text: selectedText,
      comment: null,
      timestamp: new Date().toISOString(),
    };

    const updatedHighlights = [...highlights, newHighlight];
    setHighlights(updatedHighlights);

    await saveDiscourseWithHighlights(updatedHighlights);

    window.getSelection().removeAllRanges();
    setShowHighlightPopover(false);
    setSelectedText("");
  };

  // Handle comment action
  const handleComment = async (commentText) => {
    if (!selectedText || !user || !data) return;

    const highlightId = Date.now().toString();
    const newHighlight = {
      id: highlightId,
      text: selectedText,
      comment: commentText,
      timestamp: new Date().toISOString(),
    };

    const updatedHighlights = [...highlights, newHighlight];
    setHighlights(updatedHighlights);

    await saveDiscourseWithHighlights(updatedHighlights);

    window.getSelection().removeAllRanges();
    setShowHighlightPopover(false);
    setSelectedText("");
  };

  // Save or update discourse with highlights
  const saveDiscourseWithHighlights = async (highlightsArray) => {
    if (!user || !user.token || !data) return;

    const discourseTitle = `${data.title} of "${data.collection}"`;
    const existingSaved = getSavedDiscourseByTitle(discourseTitle);

    const discourseData = {
      title: discourseTitle,
      content: data.content,
      source_url: `/blog/${data._id}`,
      source_citation: `${data.date} - ${data.collection}`,
      highlights: highlightsArray,
    };

    if (existingSaved) {
      // Update existing with new highlights
      await updateSavedDiscourse(existingSaved.id, { highlights: highlightsArray });
    } else {
      // Create new saved discourse with the question context from navigation state
      const questionContext = state?.questionContext || "Browsing discourses";
      await saveDiscourse(discourseData, questionContext);
    }
  };

  // Remove highlight
  const handleRemoveHighlight = async (highlightId) => {
    const updatedHighlights = highlights.filter(h => h.id !== highlightId);
    setHighlights(updatedHighlights);

    const discourseTitle = `${data.title} of "${data.collection}"`;
    const existingSaved = getSavedDiscourseByTitle(discourseTitle);

    // Check if there are any highlights left
    if (updatedHighlights.length === 0 && existingSaved) {
      // No highlights left - check if discourse should be unsaved
      // Check if the discourse has a valid question context
      const questionContext = existingSaved.question_context;
      const hasValidQuestionContext = questionContext &&
        questionContext.trim() !== "" &&
        questionContext !== "No question provided" &&
        questionContext !== "From blog page" &&
        questionContext !== "Browsing discourses";

      if (!hasValidQuestionContext) {
        // No valid question context and no highlights - remove the saved discourse entirely
        await unsaveDiscourse(existingSaved.id);
        return; // Exit early, don't update highlights
      }
    }

    // Update the saved discourse with new highlights (or empty array if all removed but has valid question)
    if (existingSaved) {
      await saveDiscourseWithHighlights(updatedHighlights);
    }
  };

  // Scroll to and highlight a specific text when clicking on a highlight
  const handleHighlightClick = (highlight) => {
    if (!contentRef.current) return;

    // Find the text in the content
    const contentElement = contentRef.current;
    const textToFind = highlight.text;

    // Create a temporary walker to find the text node
    const walker = document.createTreeWalker(
      contentElement,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let foundNode = null;
    let foundOffset = 0;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const nodeText = node.textContent || "";
      const index = nodeText.indexOf(textToFind);

      if (index !== -1) {
        foundNode = node;
        foundOffset = index;
        break;
      }
    }

    if (foundNode) {
      // First, highlight the text
      setActiveHighlightId(highlight.id);

      // Find the closest parent element (paragraph or heading)
      let parentElement = foundNode.parentElement;

      if (parentElement) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          // Scroll the element to the center of the viewport
          parentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 50);
      }

      // Remove the highlight after 3 seconds
      setTimeout(() => {
        setActiveHighlightId(null);
      }, 3000);
    }
  };

  // Helper function to render text with active highlight
  const renderContentWithHighlight = (text) => {
    if (!activeHighlightId) return text;

    const activeHighlight = highlights.find(h => h.id === activeHighlightId);
    if (!activeHighlight) return text;

    const highlightText = activeHighlight.text;
    const index = text.indexOf(highlightText);

    if (index === -1) return text;

    // Split text and add animated highlight
    const before = text.substring(0, index);
    const highlight = text.substring(index, index + highlightText.length);
    const after = text.substring(index + highlightText.length);

    return (
      <>
        {before}
        <span className="bg-yellow-400 animate-pulse px-1 rounded transition-all duration-300">
          {highlight}
        </span>
        {after}
      </>
    );
  };

  if (isLoading || isRefetching) {
    return (
      <div className="h-screen flex flex-col bg-transparent">
        <div className="flex flex-auto flex-col justify-center items-center p-4 md:p-5">
          <div className="flex justify-center">
            <div
              className="animate-spin inline-block size-20 border-[3px] border-current border-t-transparent text-orange-400 rounded-full"
              role="status"
              aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) return <ErrorPage />;

  if (data) {
    // console.log("🚀 ~ Blog ~ data:", data);
    // return <div>{JSON.stringify(data)}</div>;
    const post = data;

    return (
      <div className="w-full">
        {/* Text Highlight Popover */}
        <TextHighlightPopover
          visible={showHighlightPopover}
          position={popoverPosition}
          onHighlight={handleHighlight}
          onComment={handleComment}
          onClose={() => {
            setShowHighlightPopover(false);
            window.getSelection().removeAllRanges();
          }}
        />

        <div className="w-full h-[375px] flex flex-col bg-[#FE9F440A] items-center">
          <div className="p-9 flex justify-between w-full">
            {/* nav section */}
            <Logo />
            <Navbar variant="blog" />
          </div>
          <h1 className=" text-[22px] text-center font-bold mb-10">
            {post?.title}
          </h1>

          <Link to="/">
            <button className=" gap-1 shadow px-4 py-2 bg-orange-400 text-white flex items-center rounded mb-2">
              <LuPencilLine size={18} />
              {state?.citations?.length
                ? "Go back to chat"
                : "Ask your question"}
            </button>
          </Link>
          <div>
            <img src={bgflower} alt="" className="w-full " />
          </div>
        </div>
        <div className="flex flex-wrap justify-center  w-[96vw] max:w-[1400px] mx-auto md:gap-12 gap-4 leading-8">
          <div className=" flex flex-col md:w-[800px]  border border-gray-300 rounded shadow p-8 gap-8 relative -top-20 bg-white">
            <h2 className=" text-[20px] mt-4 text-center font-bold text-[#4D4D4D]">
              {post?.occasion}
            </h2>
            <div className="w-full flex justify-between">
              {post.collection && (
                <div className="flex gap-2 text-sm items-center">
                  <IoMdList size={18} className="text-orange-400" />
                  <p className="text-gray-500">{post.collection}</p>
                </div>
              )}

              {post.date && (
                <div className="flex gap-2 text-sm items-center ">
                  <IoCalendar size={18} className="text-orange-400" />
                  <p className="text-gray-500">{post.date}</p>
                </div>
              )}
            </div>
            <div className="p-4 md:p-8 flex flex-col gap-8" ref={contentRef}>
              {/* Show highlights if any */}
              {highlights.length > 0 && (
                <div className="mb-4 bg-yellow-50 p-4 rounded border border-yellow-200">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-yellow-600">✨</span>
                    Your Highlights & Comments ({highlights.length})
                  </h3>
                  <div className="space-y-3">
                    {highlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className="bg-white p-3 rounded border border-yellow-300 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleHighlightClick(highlight)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="bg-yellow-200 px-2 py-1 rounded inline-block mb-2 hover:bg-yellow-300 transition-colors">
                              <p className="text-sm text-gray-800">
                                "{highlight.text.substring(0, 100)}{highlight.text.length > 100 ? '...' : ''}"
                              </p>
                            </div>
                            {highlight.comment && (
                              <div className="mt-2 pl-3 border-l-2 border-blue-400">
                                <p className="text-xs text-gray-600 font-medium">Your comment:</p>
                                <p className="text-sm text-blue-700 italic mt-1">
                                  💬 {highlight.comment}
                                </p>
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(highlight.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the highlight click
                              handleRemoveHighlight(highlight.id);
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove highlight"
                          >
                            <MdClose size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content with text selection enabled - Added padding bottom for scroll space */}
              <div onMouseUp={handleTextSelection} className="select-text cursor-text pb-[50vh]">
                {post?.content?.split("\n").map((text, index) => (
                  <React.Fragment key={index}>
                    {text.includes(". ") ? (
                      <p className="mb-4">{renderContentWithHighlight(text)}</p>
                    ) : (
                      <h3 className="text-lg mb-4">
                        <strong>{renderContentWithHighlight(text)}</strong>
                      </h3>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Floating Citations Tab */}
        {citations.length > 0 && (
          <button
            onClick={() => setCitationsOpen(true)}
            className="fixed top-1/2 -translate-y-1/2 right-0 z-40 flex items-center gap-2 bg-white border border-gray-200 shadow-lg px-3 py-4 rounded-l-xl text-orange-400 hover:bg-orange-50 transition-colors"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            <TbLayoutSidebarRightExpand size={20} style={{ transform: "rotate(180deg)" }} />
            <span className="text-xs font-semibold tracking-wide text-gray-600">Citations ({citations.length})</span>
          </button>
        )}

        {/* Citations Drawer Overlay */}
        {citationsOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Dimmed background */}
            <div
              className="absolute inset-0 bg-black/20"
              onClick={() => setCitationsOpen(false)}
            />

            {/* Drawer panel */}
            <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-hidden">
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <button
                  onClick={() => setCitationsOpen(false)}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <MdClose size={22} />
                </button>
                <h2 className="text-sm font-semibold text-gray-700">Citations ({citations.length})</h2>
                <div className="w-6" />
              </div>

              {/* Citation cards */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                {citations.map((c, i) => {
                  const lookupTitle = `${c.title} of "${c.collection}"`;
                  const savedDiscourse = getSavedDiscourseByTitle(lookupTitle);
                  const recentHighlights = user && savedDiscourse?.discourse?.highlights
                    ? [...savedDiscourse.discourse.highlights]
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .slice(0, 3)
                    : [];
                  const isActive = slugId === c._id;

                  return (
                    <Link
                      key={i}
                      to={`/blog/${c._id}`}
                      state={{ citations, questionContext: state?.questionContext }}
                      onClick={() => setCitationsOpen(false)}
                    >
                      <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
                        isActive
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-200 hover:bg-orange-50/50"
                      }`}>
                        <p className={`font-medium text-sm ${isActive ? "text-orange-600" : "text-gray-800"}`}>
                          {c.title}
                        </p>

                        <div className="flex flex-col gap-1">
                          {c.collection && (
                            <div className="flex gap-2 items-center text-xs text-gray-500">
                              <IoMdList size={14} className="text-orange-400 shrink-0" />
                              <span>{c.collection.replace(/(\d)(Disc\.)/g, '$1 $2')}</span>
                            </div>
                          )}
                          {c.date && (
                            <div className="flex gap-2 items-center text-xs text-gray-500">
                              <IoCalendar size={14} className="text-orange-400 shrink-0" />
                              <span>{c.date}</span>
                            </div>
                          )}
                        </div>

                        {/* Highlights & comments */}
                        {recentHighlights.length > 0 && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500">
                              Your highlights {savedDiscourse.discourse.highlights.length > 3 ? `(showing 3 of ${savedDiscourse.discourse.highlights.length})` : ""}
                            </p>
                            {recentHighlights.map((h) => (
                              <div key={h.id} className="flex flex-col gap-1">
                                <div className="bg-yellow-100 rounded px-2 py-1">
                                  <p className="text-xs text-gray-700 line-clamp-2">
                                    "{h.text.substring(0, 80)}{h.text.length > 80 ? "…" : ""}"
                                  </p>
                                </div>
                                {h.comment && (
                                  <p className="text-xs text-blue-600 italic pl-2 border-l-2 border-blue-300">
                                    {h.comment}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
