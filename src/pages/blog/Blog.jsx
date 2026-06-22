import React, { useEffect, useState, useRef } from "react";
import { LuPencilLine } from "react-icons/lu";
import { IoCalendar } from "react-icons/io5";
import { useQuery } from "react-query";
import { IoMdList } from "react-icons/io";
import { MdClose } from "react-icons/md";
import { Link, useLocation, useParams } from "react-router-dom";

import bgflower from "../../images/bgflower.png";
import Logo from "../../components/logo/Logo";
import { fetchBlogPost } from "../../helpers/apiRoute";
import ErrorPage from "../../components/error/ErrorPage";
import Navbar from "../../components/Navbar";
import TextHighlightPopover from "../../components/chat/TextHighlightPopover";
import { useAuth } from "../../contexts/AuthContext";
import { useSavedDiscourses } from "../../contexts/SavedDiscoursesContext";
import { formatCollection } from "../../helpers/formatCollection";

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

  // Highlighting state
  const [showHighlightPopover, setShowHighlightPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [activeHighlightId, setActiveHighlightId] = useState(null); // Track which highlight is being viewed
  const contentRef = useRef(null);
  const matchedRef = useRef(null); // the braces-wrapped matched passage block

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

  // When a discourse is opened from a citation, scroll the matched passage into
  // view once it has rendered, so the answer is shown immediately.
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => {
      if (matchedRef.current) {
        matchedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
    return () => clearTimeout(t);
  }, [data, slugId]);

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

    // If we arrived here from a chat/search citation, find the matched passage
    // for THIS discourse and locate the contiguous block of paragraphs it covers,
    // so we can wrap it in decorative braces to show where the answer lives.
    const matchedCitation = state?.citations?.find(
      (c) => c._id === slugId || c._id === post._id
    );
    let matchedPassageText = matchedCitation?.matched_passage || "";

    // Fallback: router state is lost on refresh / direct URL, so recover the
    // matched passage for this discourse from sessionStorage (set at search time).
    if (!matchedPassageText) {
      try {
        const map = JSON.parse(
          sessionStorage.getItem("asv_matched_passages") || "{}"
        );
        matchedPassageText = map[slugId] || map[post._id] || "";
      } catch (e) {
        /* sessionStorage unavailable — non-fatal */
      }
    }

    const contentLines = (post?.content || "").split("\n");
    const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();
    const normMatched = normalize(matchedPassageText);
    const normFull = normalize(post?.content || "");

    // Map each non-empty line to its [start, end) char span within normFull, in order.
    let cursor = 0;
    const lineSpans = contentLines.map((line) => {
      const nl = normalize(line);
      if (!nl) return null;
      const idx = normFull.indexOf(nl, cursor);
      if (idx === -1) return null;
      cursor = idx + nl.length;
      return [idx, idx + nl.length];
    });

    // Locate the passage's char span using a distinctive middle anchor — robust
    // to a truncated overlap prefix and to passages that are only part of a
    // (very long) paragraph.
    let passageSpan = null;
    if (normMatched) {
      const anchorLen = Math.min(120, normMatched.length);
      const anchorStart = Math.max(0, Math.floor((normMatched.length - anchorLen) / 2));
      const anchor = normMatched.slice(anchorStart, anchorStart + anchorLen);
      const pos = normFull.indexOf(anchor);
      if (pos !== -1) {
        const start = Math.max(0, pos - anchorStart);
        passageSpan = [start, start + normMatched.length];
      }
    }

    let matchStart = -1;
    let matchEnd = -1;
    if (passageSpan) {
      contentLines.forEach((line, i) => {
        const span = lineSpans[i];
        if (!span) return;
        const interStart = Math.max(span[0], passageSpan[0]);
        const interEnd = Math.min(span[1], passageSpan[1]);
        const inter = interEnd - interStart;
        if (inter <= 0) return;
        const lineLen = span[1] - span[0];
        const passageInsideLine =
          passageSpan[0] >= span[0] && passageSpan[1] <= span[1];
        // Mark a paragraph if the passage is inside it, or it is mostly covered
        // by the passage (filters out the partial overlap paragraph at the top).
        if (passageInsideLine || inter >= lineLen * 0.5) {
          if (matchStart === -1) matchStart = i;
          matchEnd = i;
        }
      });
    }

    const renderLine = (text, index) => (
      <React.Fragment key={index}>
        {text.includes(". ") ? (
          <p className="mb-4">{renderContentWithHighlight(text)}</p>
        ) : (
          <h3 className="text-lg mb-4">
            <strong>{renderContentWithHighlight(text)}</strong>
          </h3>
        )}
      </React.Fragment>
    );

    const braceStyle = {
      fontSize: "2.5rem",
      transform: "scaleY(7)",
      transformOrigin: "center",
    };

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
                  <p className="text-gray-500">{formatCollection(post.collection)}</p>
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
                {matchStart === -1 ? (
                  contentLines.map((text, index) => renderLine(text, index))
                ) : (
                  <>
                    {contentLines
                      .slice(0, matchStart)
                      .map((text, index) => renderLine(text, index))}

                    {/* Matched passage — wrapped in decorative braces */}
                    <div ref={matchedRef} className="relative my-6 px-10">
                      <span
                        aria-hidden="true"
                        className="pointer-events-none select-none absolute left-0 top-0 bottom-0 flex items-center font-light text-gray-600"
                        style={braceStyle}
                      >
                        {"{"}
                      </span>
                      {contentLines
                        .slice(matchStart, matchEnd + 1)
                        .map((text, index) => renderLine(text, matchStart + index))}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none select-none absolute right-0 top-0 bottom-0 flex items-center font-light text-gray-400"
                        style={braceStyle}
                      >
                        {"}"}
                      </span>
                    </div>

                    {contentLines
                      .slice(matchEnd + 1)
                      .map((text, index) => renderLine(text, matchEnd + 1 + index))}
                  </>
                )}
              </div>
            </div>
          </div>

          {state?.citations?.length && (
            <div className="w-[440px] flex flex-col mt-12 gap-2 mb-12">
              <p>Citations</p>
              {state?.citations?.map((c, i) => (
                <Link
                  to={`/blog/${c._id}`}
                  state={state}
                  key={i}
                // reloadDocument
                >
                  <div
                    className={`w-[420px] border ${slugId === c._id
                      ? "border-[#FE9F44] bg-[#fe9e4417] "
                      : "border-b hover:bg-[#fe9e4425]"
                      } rounded-lg p-6 flex flex-col gap-4`}>
                    <p className="text-[#4D4D4D]">{c?.title}</p>
                    <div className="flex gap-2 text-sm items-center">
                      <IoMdList size={18} className="text-orange-400" />
                      <p className="text-gray-500">{formatCollection(c?.collection)}</p>
                    </div>
                    <div className="flex gap-2 text-sm items-center ">
                      <IoCalendar size={18} className="text-orange-400" />
                      <p className="text-gray-500">{c?.date}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {/* <div className="w-[420px] bg-[##FE9F440A] border border-[#FE9F44] rounded-lg p-6 flex flex-col gap-4">
              <p className="text-[#4D4D4D]">Sristi and Dristhi</p>
              <div className="flex gap-2 text-sm items-center">
                <IoMdList size={18} className="text-orange-400" />
                <p className="text-gray-500">SSS, Vol 29 Disc. 10</p>
              </div>
              <div className="flex gap-2 text-sm items-center ">
                <IoCalendar size={18} className="text-orange-400" />
                <p className="text-gray-500">12 April 1996</p>
              </div>
            </div>
            <div className="w-[420px]  border-b rounded-lg p-6 flex flex-col gap-4">
              <p>Nammi Nammi</p>
              <div className="flex gap-2 text-sm items-center">
                <IoMdList size={18} className="text-orange-400" />
                <p className="text-gray-500">SSS, Vol 29 Disc. 10</p>
              </div>
              <div className="flex gap-2 text-sm items-center ">
                <IoCalendar size={18} className="text-orange-400" />
                <p className="text-gray-500">12 April 1996</p>
              </div>
            </div>
            <div className="w-[420px]  border-b rounded-lg p-6 flex flex-col gap-4">
              <p>Power of meditation</p>
              <div className="flex gap-2 text-sm items-center">
                <IoMdList size={18} className="text-orange-400" />
                <p className="text-gray-500">SSS, Vol 29 Disc. 10</p>
              </div>
              <div className="flex gap-2 text-sm items-center ">
                <IoCalendar size={18} className="text-orange-400" />
                <p className="text-gray-500">12 April 1996</p>
              </div>
            </div> */}
            </div>
          )}
        </div>
      </div>
    );
  }
}
