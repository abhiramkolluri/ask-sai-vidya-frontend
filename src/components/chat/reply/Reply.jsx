import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  IoCopyOutline,
  IoLinkOutline,
  IoThumbsDownOutline,
  IoThumbsUpOutline,
} from "react-icons/io5";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { GoArrowUpRight } from "react-icons/go";
import { FaSpinner } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { Link } from "react-router-dom";
import { apiRoute, submitFeedback } from "../../../helpers/apiRoute";
import { formatCollection } from "../../../helpers/formatCollection";

import Feedback from "../../feedback/Feedback";
import TextHighlightPopover from "../TextHighlightPopover";
import { useSavedDiscourses } from "../../../contexts/SavedDiscoursesContext";
import FollowUpQuestions from "../../followups/FollowUpQuestions";
import StagedLotusLoader from "../../common/StagedLotusLoader";
import SearchTracePanel from "./SearchTracePanel";
import SearchGuidance from "./SearchGuidance";
import { buildSummaryLine } from "./traceSummary";

// Question words that keep a short query on the semantic route — a subset of the
// backend's list (search/query_planning.py::is_keyword_query), enough for the
// 1-2 token strings this is ever asked about.
const QUESTION_WORDS = new Set([
  "what", "why", "how", "when", "where", "who", "whom", "which", "whose",
  "is", "are", "was", "were", "am", "be", "do", "does", "did",
  "can", "could", "should", "would", "will", "shall", "may", "might", "must",
  "tell", "give", "show", "list", "find", "explain", "define", "describe",
  "compare", "summarize", "vs", "versus",
]);

// Mirrors the backend's keyword-route gate closely enough to pick loader copy
// BEFORE the response arrives. The backend is authoritative — this only decides
// which caption shows during the ~1s wait, so a disagreement costs a slightly
// off caption, never a wrong result.
function isBareTerm(question) {
  const q = (question || "").trim();
  if (!q || q.includes("?") || q.includes('"')) return false;
  const tokens = q.split(/\s+/).map((t) => t.replace(/^[^\w]+|[^\w]+$/g, "")).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 2) return false;
  return !tokens.some((t) => QUESTION_WORDS.has(t.toLowerCase()));
}

export default function Reply({
  question = "What the user asked?",
  reply,
  loading,
  onLinkClick,
  onReloadClick,
  onCopyClick,
  onSaveDiscourse,
  onUnsaveDiscourse,
  user = null,
  onHighlightChange = () => { },
  followUps = [],
  onFollowUpClick = () => { },
  onGenerateFollowups = () => { },
  followUpsLoading = false,
}) {
  const {
    isDiscourseBookmarked,
    saveHighlights,
    getDiscourseByTitle,
  } = useSavedDiscourses();
  const [showFeedbackModal, setshowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null); // 'up' or 'down'
  const [feedbackItem, setFeedbackItem] = useState(null); // the discourse feedback is for

  // Text selection and highlighting state
  const [showHighlightPopover, setShowHighlightPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState(null);
  const [currentDiscourseId, setCurrentDiscourseId] = useState(null);
  const [highlights, setHighlights] = useState({}); // { discourseId: [{ id, text, comment, ... }] }
  const contentRefs = useRef({}); // Store refs for each discourse content

  // Handle text selection in discourse content
  const handleTextSelection = (discourseId) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0 && user && user.token) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Get the discourse content container to position popover in the right margin
      const contentContainer = contentRefs.current[discourseId];
      if (!contentContainer) return;

      const containerRect = contentContainer.getBoundingClientRect();

      // Position the popover in the right margin, aligned with the selection
      // Place it to the right of the content area
      setPopoverPosition({
        x: containerRect.right + 20, // 20px margin from the right edge of content
        y: rect.top, // Align with the top of the selection (using fixed positioning)
      });

      setSelectedText(selectedText);
      setSelectionRange({
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
        text: selectedText,
      });
      setCurrentDiscourseId(discourseId);
      setShowHighlightPopover(true);
    } else {
      setShowHighlightPopover(false);
    }
  };

  // Hide popover on scroll - using useEffect at the component level
  React.useEffect(() => {
    const handleScroll = () => {
      if (showHighlightPopover) {
        setShowHighlightPopover(false);
        window.getSelection().removeAllRanges();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showHighlightPopover]);

  React.useEffect(() => {
    const citations = reply?.citations || [];
    if (!citations.length) return;

    setHighlights((prev) => {
      const next = { ...prev };
      citations.forEach((citation) => {
        const discourseTitle = `${citation.title} of "${citation.collection}"`;
        const saved = getDiscourseByTitle(discourseTitle);
        const savedHighlights = saved?.discourse?.highlights;
        if (Array.isArray(savedHighlights) && savedHighlights.length > 0) {
          next[citation._id] = savedHighlights;
        } else {
          delete next[citation._id];
        }
      });
      return next;
    });
  }, [getDiscourseByTitle, reply]);

  // Handle highlight action
  const handleHighlight = async () => {
    if (!selectedText || !currentDiscourseId || !user) return;

    const highlightId = Date.now().toString();
    const newHighlight = {
      id: highlightId,
      text: selectedText,
      comment: null,
      timestamp: new Date().toISOString(),
      range: selectionRange,
    };

    // Add highlight to state
    setHighlights(prev => ({
      ...prev,
      [currentDiscourseId]: [...(prev[currentDiscourseId] || []), newHighlight],
    }));

    // Auto-save discourse with highlight
    const citation = citations.find(c => c._id === currentDiscourseId);
    if (citation) {
      await autoSaveDiscourseWithHighlights(citation, [...(highlights[currentDiscourseId] || []), newHighlight]);
    }

    // Clear selection
    window.getSelection().removeAllRanges();
    setShowHighlightPopover(false);
    setSelectedText("");
  };

  // Handle comment action
  const handleComment = async (commentText) => {
    if (!selectedText || !currentDiscourseId || !user) return;

    const highlightId = Date.now().toString();
    const newHighlight = {
      id: highlightId,
      text: selectedText,
      comment: commentText,
      timestamp: new Date().toISOString(),
      range: selectionRange,
    };

    // Add highlight with comment to state
    setHighlights(prev => ({
      ...prev,
      [currentDiscourseId]: [...(prev[currentDiscourseId] || []), newHighlight],
    }));

    // Auto-save discourse with highlight and comment
    const citation = citations.find(c => c._id === currentDiscourseId);
    if (citation) {
      await autoSaveDiscourseWithHighlights(citation, [...(highlights[currentDiscourseId] || []), newHighlight]);
    }

    // Clear selection
    window.getSelection().removeAllRanges();
    setShowHighlightPopover(false);
    setSelectedText("");
  };

  const autoSaveDiscourseWithHighlights = async (citation, highlightsArray) => {
    const discourseTitle = `${citation.title} of "${citation.collection}"`;

    const discourseData = {
      title: discourseTitle,
      content: citation.content,
      source_url: `/blog/${citation._id}`,
      source_citation: `${citation.date} - ${citation.collection}`,
      highlights: highlightsArray,
    };

    await saveHighlights(discourseData, highlightsArray);
  };

  const handleRemoveHighlight = async (discourseId, highlightId) => {
    const updatedHighlights = (highlights[discourseId] || []).filter(h => h.id !== highlightId);
    setHighlights(prev => ({ ...prev, [discourseId]: updatedHighlights }));
    const citation = (reply?.citations || []).find(c => c._id === discourseId);
    if (citation) {
      await autoSaveDiscourseWithHighlights(citation, updatedHighlights);
    }
  };

  const renderTextWithHighlights = (text, discourseId) => {
    const discourseHighlights = highlights[discourseId] || [];
    if (discourseHighlights.length === 0) return text;
    let result = text;
    discourseHighlights.forEach((highlight) => {
      const highlightHtml = `<mark class="bg-yellow-200 relative group cursor-pointer" data-highlight-id="${highlight.id}">
        ${highlight.text}
        ${highlight.comment ? `<span class="hidden group-hover:block absolute bottom-full left-0 bg-blue-600 text-white text-xs p-2 rounded shadow-lg mb-1 w-48 z-10">${highlight.comment}</span>` : ''}
      </mark>`;
      result = result.replace(highlight.text, highlightHtml);
    });
    return result;
  };

  const isDiscourseSaved = (discourseTitle) => isDiscourseBookmarked(discourseTitle);

  const handleBookmarkClick = async (citation) => {
    if (!user || !user.token) {
      alert('Please log in to save discourses');
      return;
    }

    const discourseTitle = `${citation.title} of "${citation.collection}"`;

    if (isDiscourseBookmarked(discourseTitle)) {
      const savedDiscourse = getDiscourseByTitle(discourseTitle);
      if (savedDiscourse) {
        await onUnsaveDiscourse(savedDiscourse.id);
      }
    } else {
      const discourseData = {
        title: discourseTitle,
        content: citation.content,
        source_url: `/blog/${citation._id}`,
        source_citation: `${citation.date} - ${citation.collection}`,
      };
      await onSaveDiscourse(discourseData, question);
    }
  };


  const handleFeedbackClick = (type, item = null) => {
    setFeedbackType(type);
    setFeedbackItem(item);
    setshowFeedbackModal(true);
  };

  // Per-discourse actions
  const handleCopyQuote = (item) => {
    navigator.clipboard.writeText(item.best_sentence || item.content || "");
    alert("Quote copied to clipboard!");
  };

  const handleCopyDiscourseLink = (item) => {
    navigator.clipboard.writeText(`${window.location.origin}/blog/${item._id}`);
    alert("Source link copied to clipboard!");
  };

  const handleFeedback = async (type, reason, additionalComments = '') => {
    try {
      const feedbackData = {
        question,
        answer: feedbackItem
          ? (feedbackItem.best_sentence || feedbackItem.content || "")
          : reply.primaryResponse,
        discourseTitle: feedbackItem?.title || null,
        discourseId: feedbackItem?._id || null,
        discourseSource: feedbackItem?.collection || null,
        feedbackType: type,
        reason,
        additionalComments,
        timestamp: new Date().toISOString(),
        citations: feedbackItem ? [feedbackItem] : (reply.citations || [])
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
        <div className="mx-auto mt-6">
          {/* Narrate the pipeline stages while the query runs. Detect a quoted
              phrase so the loader can say "looking for your exact phrase", and a
              bare term so it doesn't narrate planning/grading that won't run. */}
          <StagedLotusLoader
            hasExactPhrase={question.includes('"')}
            isKeyword={isBareTerm(question)}
          />
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

  // `pending` marks phase 1 of a two-phase search: these discourses are real
  // matches but no quote has been verified yet, and the grader typically drops
  // some of them when phase 2 lands. Everything downstream renders them as
  // provisional rather than as answers.
  const { citations = [], pending = false } = reply;
  // Any reply with nothing to read. An explicit refusal is one kind, but a
  // question that matched nothing, fell outside the corpus, or hit a known gap
  // leaves the same empty screen — and in every one of those cases the suggested
  // questions ARE the response, so the follow-up block renders (it is normally
  // gated on having results) and auto-fills rather than hiding behind a button.
  // `pending` is excluded: phase 1 has results, just unverified ones.
  const hasNoAnswer = !pending && citations.length === 0;

  return (
    <div className="w-full mx-2">
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

      <div className="flex justify-end">
        <div className="bg-[#f5f5f5] px-6 py-4 md:w-3/4 rounded">
          <span className="text-[#252525] text-lg">{question}</span>
        </div>
      </div>

      {/* asv-fade-in: the answer eases in when it replaces the lotus loader
          instead of appearing abruptly. */}
      <div className="md:p-1 mx-2 asv-fade-in">
        <div className="border-l border-primary p-2 px-4 flex flex-col">
          <div className="px-2 py-1 flex items-end mb-2">
            <div className="">
              {/* Trace-aware summary of how the question was interpreted; falls
                  back to the legacy line when no trace is present (old messages). */}
              <p className="text-lg font-normal text-[#252525]">
                {buildSummaryLine(reply.trace, citations)}
              </p>
            </div>
          </div>

          {/* "How I searched" — the pipeline window (renders only when a trace exists). */}
          <SearchTracePanel trace={reply.trace} />

          <div className="m-2 flex flex-col bg-[#FEF4EB] rounded ">
            <div className="mx-1 flex">
              <div className="p-6">
                {citations.length > 0 ? (
                  citations.map((item, index) => {
                    const discourseTitle = `${item.title} of "${item.collection}"`;
                    const isSaved = isDiscourseSaved(discourseTitle);

                    return (
                      <div key={index} className="text-[#252525] mb-6">
                        <p className="text-xl font-bold">
                          <span className="text-primary">
                            [{index + 1}] {"\t\t"}
                          </span>
                          {item.title}
                        </p>
                        <p className="text-lg text-gray-600">
                          {formatCollection(item.collection)}
                          {/* Listing route passes chapter_index (0-based) so an
                              ordered enumeration reads like a table of contents. */}
                          {item.chapter_index != null && (
                            <span className="text-gray-500">
                              {" · Chapter "}
                              {item.chapter_index + 1}
                            </span>
                          )}
                        </p>
                        <p className="italic">{item.date}</p>

                        {/* The answering quote, verified by the grader. While a
                            two-phase search is still verifying (`pending`), we
                            show the retrieved passage as a plain excerpt WITHOUT
                            quotation marks and label it — quote marks here would
                            present unchecked text as the answering quote, which
                            is the one thing this pipeline must never do. */}
                        {pending ? (
                          <div className="p-2 ml-3">
                            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1 flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full bg-primary/50 animate-pulse" />
                              Checking whether this answers your question…
                            </div>
                            <div
                              className="text-gray-500 text-lg italic"
                              style={{ fontFamily: "'EB Garamond', serif" }}
                            >
                              {(item.matched_passage || item.content || "").slice(0, 200)}
                              {(item.matched_passage || item.content || "").length > 200 ? "…" : ""}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="p-2 ml-3 text-gray-800 text-xl italic"
                            style={{ fontFamily: "'EB Garamond', serif" }}
                          >
                            <span className="text-primary">&ldquo;</span>
                            <span
                              ref={(el) => contentRefs.current[item._id] = el}
                              className="select-text"
                              onMouseUp={() => handleTextSelection(item._id)}
                              dangerouslySetInnerHTML={{
                                __html: renderTextWithHighlights(
                                  item.best_sentence ||
                                    (item.content && item.content.length > 200
                                      ? item.content.slice(0, 200) + "..."
                                      : item.content) ||
                                    "",
                                  item._id
                                )
                              }}
                            />
                            <span className="text-primary">&rdquo;</span>
                          </div>
                        )}

                        {/* Show highlights for this discourse */}
                        {highlights[item._id] && highlights[item._id].length > 0 && (
                          <div className="mt-2 ml-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-xs font-semibold text-gray-600 mb-2">
                              Your highlights ({highlights[item._id].length}):
                            </p>
                            {highlights[item._id].map((highlight) => (
                              <div key={highlight.id} className="mb-2 text-sm">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <span className="bg-yellow-200 px-1 rounded">
                                      "{highlight.text.substring(0, 50)}..."
                                    </span>
                                    {highlight.comment && (
                                      <p className="mt-1 text-xs text-blue-700 italic">
                                        💬 {highlight.comment}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleRemoveHighlight(item._id, highlight.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    title="Remove highlight"
                                  >
                                    <MdClose size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <span className="text-primary underline text-lg">
                            <Link
                              to={`/blog/${item._id}`}
                              state={{
                                citations,
                                questionContext: question,
                                // Only a keyword-ROUTED search highlights every
                                // occurrence on the blog page. `trace.keyword` is
                                // also set when the route fell back to semantic,
                                // so gate on `route`, not on the field's presence.
                                keywordTerm:
                                  reply?.trace?.route === "keyword"
                                    ? reply.trace.keyword?.term || null
                                    : null,
                              }}
                              className="flex"
                            >
                              Read &ldquo;{item.title}&rdquo;
                              <GoArrowUpRight size={22} />
                            </Link>
                          </span>

                          {/* Per-discourse actions — horizontal, bottom-right */}
                          <div className="flex items-center gap-4 text-primary shrink-0">
                            {user && user.token && (
                              <button
                                onClick={() => handleBookmarkClick(item)}
                                title={isSaved ? "Remove from saved" : "Save discourse"}
                                className="hover:scale-110 transition-transform"
                              >
                                {isSaved ? (
                                  <BsBookmarkFill size={20} className="text-primary" />
                                ) : (
                                  <BsBookmark size={20} className="text-primary" />
                                )}
                              </button>
                            )}
                            <IoCopyOutline
                              size={20}
                              title="Copy the quote"
                              className="cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleCopyQuote(item)}
                            />
                            <IoLinkOutline
                              size={20}
                              title="Copy link to this source"
                              className="cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleCopyDiscourseLink(item)}
                            />
                            <IoThumbsUpOutline
                              size={20}
                              title="This source was helpful"
                              className="cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleFeedbackClick('up', item)}
                            />
                            <IoThumbsDownOutline
                              size={20}
                              title="This source was not helpful"
                              className="cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleFeedbackClick('down', item)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : reply.trace ? (
                  // Empty result WITH a trace → show the refinement guidance
                  // callout (derived from the pipeline's reason codes).
                  <SearchGuidance trace={reply.trace} />
                ) : (
                  <p>
                    No citations found. This is usually because the search engine
                    needs more context — try asking your question again in a
                    slightly different way.
                  </p>
                )}
              </div>
              <div className="flex-grow w-20"></div>
            </div>
          </div>
          {/* Weak-but-nonempty results → a quiet one-line refinement tip under the
              cards (SearchGuidance renders nothing when the result was strong). */}
          {reply?.citations?.length > 0 && <SearchGuidance trace={reply.trace} />}
          {(reply?.citations?.length > 0 || hasNoAnswer) && (
            <div className="mx-2 mt-2">
              {followUps && followUps.length > 0 ? (
                <>
                  {/* With no answer on screen these are not follow-ups to
                      anything — they are the questions we CAN answer, so say so
                      rather than letting them read as continuations. */}
                  {hasNoAnswer && (
                    <p className="mb-2 text-sm font-medium text-[#BC5B01]">
                      Try asking instead:
                    </p>
                  )}
                  <FollowUpQuestions
                    questions={followUps}
                    onQuestionClick={onFollowUpClick}
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onGenerateFollowups()}
                  disabled={followUpsLoading}
                  className="border border-gray-300 rounded hover:border-orange-500 hover:bg-orange-100 px-4 py-2 text-gray-800 transition-all ease-linear cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {followUpsLoading ? (
                    <>
                      <FaSpinner className="animate-spin text-orange-400" />
                      {hasNoAnswer ? "Finding questions I can answer…" : "Generating…"}
                    </>
                  ) : (
                    hasNoAnswer
                      ? "Suggest questions I can answer"
                      : "Generate Followup Questions"
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {showFeedbackModal && createPortal(
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 z-[100] p-6">
            <Feedback
              closeModalCallback={() => {
                setshowFeedbackModal(false);
                setFeedbackType(null);
                setFeedbackItem(null);
              }}
              title={feedbackType === 'up' ? "Positive Feedback" : "Negative Feedback"}
              context={
                feedbackItem && (
                  <div className="w-full rounded-lg border border-orange-200 bg-orange-50 p-4 text-left">
                    <p className="text-base font-semibold text-gray-600">
                      Your question
                    </p>
                    <p className="text-lg text-gray-900">
                      &ldquo;{question}&rdquo;
                    </p>
                    <p className="mt-3 text-base font-semibold text-gray-600">
                      Retrieved discourse
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {feedbackItem.title}
                    </p>
                    {feedbackItem.collection && (
                      <p className="text-base text-gray-600">
                        {formatCollection(feedbackItem.collection)}
                      </p>
                    )}
                    {feedbackItem.best_sentence && (
                      <p className="mt-2 text-lg text-gray-900">
                        &ldquo;{feedbackItem.best_sentence}&rdquo;
                      </p>
                    )}
                  </div>
                )
              }
              options={
                feedbackType === 'up'
                  ? [
                    "Quote answered the question",
                    "Discourse answered the question",
                  ]
                  : [
                    "Quote did not answer the question",
                    "Discourse did not answer the question",
                  ]
              }
              question={
                (feedbackType === 'up'
                  ? "This feedback means that the search engine will use this Discourse and/or quote to answer similar questions in the future. "
                  : "This feedback means that the search engine will avoid using this Discourse and/or quote to answer similar questions in the future. ") +
                "By submitting this feedback, we can help turn Ask Sai Vidya into a library for our community, one that will store the collective wisdom of our devotees and deliver it to new devotees across generations."
              }
              onSubmit={(reason, additionalComments) => handleFeedback(feedbackType, reason, additionalComments)}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
