import React, { useEffect, useState, useRef } from "react";
import { LuPencilLine } from "react-icons/lu";
import { IoCalendar, IoBookOutline } from "react-icons/io5";
import { useQuery } from "react-query";
import { IoMdList } from "react-icons/io";
import { MdClose } from "react-icons/md";
import { TbLayoutSidebarRightExpand } from "react-icons/tb";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";

import bgflower from "../../images/bgflower.png";
import Logo from "../../components/logo/Logo";
import { fetchBlogPost } from "../../helpers/apiRoute";
import ErrorPage from "../../components/error/ErrorPage";
import Navbar from "../../components/Navbar";
import TextHighlightPopover from "../../components/chat/TextHighlightPopover";
import HighlightsSidebar from "../../components/highlights/HighlightsSidebar";
import { useAuth } from "../../contexts/AuthContext";
import { useSavedDiscourses } from "../../contexts/SavedDiscoursesContext";
import { formatCollection } from "../../helpers/formatCollection";
import { useCollectionChapters } from "../../components/collections/useCollections";
import ChapterNavBar from "../../components/collections/ChapterNavBar";

export default function Blog() {
  const { slugId } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();

  // Collections context (?book=...&volume=...&year=...): present only when the
  // discourse was opened from the Collections tab. Everything it drives is
  // gated on `navBook`, so the citation flow (router state + sessionStorage)
  // is untouched when the params are absent. Query params — not router state —
  // so chapter navigation survives refresh.
  const [searchParams] = useSearchParams();
  const navBook = searchParams.get("book");
  const navVolume = searchParams.get("volume");
  const navYear = searchParams.get("year");
  const navUndated = searchParams.get("undated") === "1";
  const { data: chaptersData } = useCollectionChapters(navBook, navVolume, navYear, navUndated);

  // Use saved discourses from context
  const {
    saveHighlights,
    getSavedDiscourseByTitle,
    deleteDiscourseRecord,
    clearAnnotations,
    loadingSaved,
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
  const matchedRef = useRef(null); // the braces-wrapped matched passage block

  const { isLoading, isRefetching, data, isError } = useQuery(
    ["blogPost", slugId],
    () => fetchBlogPost(slugId),
    {
      retry: false,
      enabled: Boolean(slugId),
    },
  );

  useEffect(() => {
    setHighlights([]);
    setActiveHighlightId(null);
    setShowHighlightPopover(false);
  }, [slugId]);

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
    if (!data || data._id !== slugId || loadingSaved) return;

    const discourseTitle = `${data.title} of "${data.collection}"`;
    const savedDiscourse = getSavedDiscourseByTitle(discourseTitle);
    setHighlights(savedDiscourse?.discourse?.highlights || []);
  }, [slugId, data, loadingSaved, getSavedDiscourseByTitle]);

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

    const previousHighlights = highlights;
    const updatedHighlights = [...previousHighlights, newHighlight];
    setHighlights(updatedHighlights);

    const saved = await saveDiscourseWithHighlights(updatedHighlights);
    if (!saved) {
      setHighlights(previousHighlights);
    }

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

    const previousHighlights = highlights;
    const updatedHighlights = [...previousHighlights, newHighlight];
    setHighlights(updatedHighlights);

    const saved = await saveDiscourseWithHighlights(updatedHighlights);
    if (!saved) {
      setHighlights(previousHighlights);
    }

    window.getSelection().removeAllRanges();
    setShowHighlightPopover(false);
    setSelectedText("");
  };

  // Save or update discourse with highlights
  const saveDiscourseWithHighlights = async (highlightsArray) => {
    if (!user || !user.token || !data) return false;

    const discourseTitle = `${data.title} of "${data.collection}"`;
    const existingSaved = getSavedDiscourseByTitle(discourseTitle);

    const discourseData = {
      title: discourseTitle,
      content: data.content,
      source_url: `/blog/${data._id}`,
      source_citation: `${data.date} - ${data.collection}`,
      highlights: highlightsArray,
    };

    if (highlightsArray.length === 0) {
      if (!existingSaved) return true;
      if (existingSaved.bookmarked) {
        const result = await clearAnnotations(existingSaved.id);
        return Boolean(result);
      }
      const deleted = await deleteDiscourseRecord(existingSaved.id);
      return Boolean(deleted);
    }

    const result = await saveHighlights(discourseData, highlightsArray);
    return Boolean(result);
  };

  // Remove highlight
  const handleRemoveHighlight = async (highlightId) => {
    const previousHighlights = highlights;
    const updatedHighlights = highlights.filter(h => h.id !== highlightId);
    setHighlights(updatedHighlights);

    const saved = await saveDiscourseWithHighlights(updatedHighlights);
    if (!saved) {
      setHighlights(previousHighlights);
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
        <span className="bg-orange-300 animate-pulse px-1 rounded transition-all duration-300">
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

    // Positional prev/next within the collection's chapter list (positional so
    // gaps/duplicates in chapter_index are harmless). idx === -1 (e.g. stale
    // list) degrades to breadcrumb-only.
    const chapterList = navBook ? chaptersData?.chapters || [] : [];
    const chapterIdx = chapterList.findIndex(
      (c) => c.id === post._id || c.id === slugId
    );
    const prevChapter = chapterIdx > 0 ? chapterList[chapterIdx - 1] : null;
    const nextChapter =
      chapterIdx !== -1 && chapterIdx < chapterList.length - 1
        ? chapterList[chapterIdx + 1]
        : null;
    // Position-within-book line for the metadata row: "Vol 14 · Discourse 10"
    // for Sathya Sai Speaks, "Chapter 3" for vahinis, "Discourse N" for the
    // year-based series. Omitted when the corpus has no position data.
    const isVahini = (post.book || post.collection || "")
      .toLowerCase()
      .includes("vahini");
    const positionWord = isVahini ? "Chapter" : "Discourse";
    // Old SSS collection_names already carry "Vol N, Disc. M" (rendered by
    // formatCollection) — don't repeat it on a second line.
    const chapterLabel = /vol\s*\d/i.test(post.collection || "")
      ? ""
      : [
          post.volume != null ? `Vol ${post.volume}` : null,
          post.chapter_index != null
            ? `${positionWord} ${post.chapter_index + 1}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

    const chapterNav = navBook ? (
      <ChapterNavBar
        book={navBook}
        volume={navVolume}
        year={navYear}
        undated={navUndated}
        prevChapter={prevChapter}
        nextChapter={nextChapter}
        chaptersQS={searchParams.toString()}
      />
    ) : null;

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

    // The best-answer quote (1–3 sentences) for THIS discourse — highlighted and
    // scrolled to. From router state, with a sessionStorage fallback for refresh.
    let bestSentence = matchedCitation?.best_sentence || "";
    if (!bestSentence) {
      try {
        const qmap = JSON.parse(
          sessionStorage.getItem("asv_best_sentences") || "{}"
        );
        bestSentence = qmap[slugId] || qmap[post._id] || "";
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

    // Locate the best-answer quote within the matched paragraph range so we can
    // highlight just those sentences (and scroll to them) instead of the whole
    // paragraph. Whitespace-tolerant, mirroring the backend's verbatim check.
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let quoteLineIndex = -1;
    let quoteParts = null;
    if (bestSentence && matchStart !== -1) {
      const tokens = bestSentence.trim().split(/\s+/).filter(Boolean).map(escapeRegExp);
      if (tokens.length) {
        const re = new RegExp(tokens.join("\\s+"));
        for (let i = matchStart; i <= matchEnd; i++) {
          const m = contentLines[i].match(re);
          if (m) {
            quoteLineIndex = i;
            quoteParts = {
              before: contentLines[i].slice(0, m.index),
              text: m[0],
              after: contentLines[i].slice(m.index + m[0].length),
            };
            break;
          }
        }
      }
    }

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
          <div className="p-9 flex justify-between w-full items-start">
            <div className="flex flex-col gap-2">
              <Logo />
              {user?.token && (
                <HighlightsSidebar
                  highlights={highlights}
                  onHighlightClick={handleHighlightClick}
                  onRemoveHighlight={handleRemoveHighlight}
                  activeHighlightId={activeHighlightId}
                />
              )}
            </div>
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
        <div className="flex flex-wrap md:flex-nowrap justify-center items-start w-[96vw] max-w-[1400px] mx-auto md:gap-4 gap-4 leading-8 px-2">
          <div className="flex flex-col w-full md:w-[800px] md:flex-shrink-0 border border-gray-300 rounded shadow p-8 gap-8 relative -top-20 bg-white">
            {chapterNav && (
              <div className="flex justify-center border-b border-orange-100 pb-2 -mb-4">
                {chapterNav}
              </div>
            )}
            <h2 className=" text-[20px] mt-4 text-center font-bold text-[#4D4D4D]">
              {post?.occasion}
            </h2>
            <div className="w-full flex flex-wrap gap-x-6 gap-y-2 justify-between">
              {post.collection && (
                <div className="flex gap-2 text-sm items-center">
                  <IoMdList size={18} className="text-orange-400" />
                  <p className="text-gray-500">{formatCollection(post.collection)}</p>
                </div>
              )}

              {chapterLabel && (
                <div className="flex gap-2 text-sm items-center">
                  <IoBookOutline size={18} className="text-orange-400" />
                  <p className="text-gray-500">{chapterLabel}</p>
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
              {/* Content with text selection enabled - Added padding bottom for scroll space */}
              <div onMouseUp={handleTextSelection} className="select-text cursor-text pb-[50vh]">
                {contentLines.map((text, index) => {
                  // The paragraph holding the quote: highlight just the quote span
                  // and anchor the scroll ref to it.
                  if (index === quoteLineIndex && quoteParts) {
                    return (
                      <p key={index} className="mb-4">
                        {quoteParts.before}
                        <mark
                          ref={matchedRef}
                          className="bg-yellow-300 rounded px-0.5 animate-[pulse_1.2s_ease-in-out_2]"
                        >
                          {quoteParts.text}
                        </mark>
                        {quoteParts.after}
                      </p>
                    );
                  }
                  // Fallback: quote not locatable, but we know the matched paragraph —
                  // gently highlight it and anchor the scroll there.
                  if (quoteLineIndex === -1 && index === matchStart) {
                    return (
                      <p key={index} ref={matchedRef} className="mb-4 bg-yellow-100 rounded px-0.5">
                        {renderContentWithHighlight(text)}
                      </p>
                    );
                  }
                  return renderLine(text, index);
                })}
              </div>
            </div>
            {chapterNav && (
              <div className="flex justify-center border-t border-orange-100 pt-4">
                {chapterNav}
              </div>
            )}
          </div>

          {state?.citations?.length && (
            <div className="w-full md:w-[360px] md:flex-shrink-0 flex flex-col mt-12 md:mt-0 gap-2 mb-12 relative -top-20">
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
