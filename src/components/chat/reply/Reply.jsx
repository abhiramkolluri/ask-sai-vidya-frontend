import React, { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  IoCopyOutline,
  IoLinkOutline,
  IoThumbsDownOutline,
  IoThumbsUpOutline,
} from "react-icons/io5";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { apiRoute, submitFeedback } from "../../../helpers/apiRoute";
import { formatCollection } from "../../../helpers/formatCollection";
import { normalizeSelectionText, getSelectionTextInContainer } from "../../../helpers/highlightUtils";

import Feedback from "../../feedback/Feedback";
import TextHighlightPopover from "../TextHighlightPopover";
import { useSavedDiscourses } from "../../../contexts/SavedDiscoursesContext";
import FollowUpQuestions from "../../followups/FollowUpQuestions";

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
  const navigate = useNavigate();
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
  const pinnedSelectedTextRef = useRef("");
  const selectionFrozenRef = useRef(false);
  const showPopoverRef = useRef(false);
  showPopoverRef.current = showHighlightPopover;

  const resolveSelectedText = useCallback(() => {
    const container = currentDiscourseId
      ? contentRefs.current[currentDiscourseId]
      : null;
    return (
      pinnedSelectedTextRef.current ||
      getSelectionTextInContainer(container) ||
      normalizeSelectionText(selectedText)
    );
  }, [currentDiscourseId, selectedText]);

  const handleCommentModeChange = useCallback(
    (frozen) => {
      selectionFrozenRef.current = frozen;
      if (frozen && currentDiscourseId) {
        const container = contentRefs.current[currentDiscourseId];
        const text =
          getSelectionTextInContainer(container) ||
          pinnedSelectedTextRef.current;
        if (text) {
          pinnedSelectedTextRef.current = text;
          setSelectedText(text);
        }
      }
    },
    [currentDiscourseId]
  );

  // Handle text selection in discourse content
  const handleTextSelection = (discourseId) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0 && user && user.token) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      const contentContainer = contentRefs.current[discourseId];
      if (!contentContainer) return;

      const containerRect = contentContainer.getBoundingClientRect();
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

      if (isDesktop) {
        setPopoverPosition({
          x: containerRect.right + 20,
          y: rect.top,
        });
      }

      setSelectedText(selectedText);
      pinnedSelectedTextRef.current = normalizeSelectionText(selectedText);
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

  // Mobile text selection: keep syncing while the sheet is open so handle
  // adjustments update the preview; freeze only in comment mode.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    if (!user || !user.token) return;

    let timer = null;
    const onSelectionChange = () => {
      if (selectionFrozenRef.current) return;

      if (timer) clearTimeout(timer);
      const delay = showPopoverRef.current ? 120 : 450;
      timer = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const entry = Object.entries(contentRefs.current).find(([, el]) => {
          if (!el) return false;
          return el.contains(selection.getRangeAt(0).commonAncestorContainer);
        });
        if (!entry) return;

        const [discourseId, el] = entry;
        const text = getSelectionTextInContainer(el);
        if (!text) return;

        const range = selection.getRangeAt(0);
        setSelectedText(text);
        pinnedSelectedTextRef.current = text;
        setSelectionRange({
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset,
          text,
        });
        setCurrentDiscourseId(discourseId);
        setShowHighlightPopover(true);
      }, delay);
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      if (timer) clearTimeout(timer);
    };
  }, [user]);

  // Hide popover on scroll (desktop only — on mobile the bottom sheet is
  // dismissed via its backdrop, and scroll fires during touch selection).
  React.useEffect(() => {
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }
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
  const handleHighlight = async (passageText) => {
    const text = normalizeSelectionText(passageText) || resolveSelectedText();
    if (!text || !currentDiscourseId || !user) return false;

    const highlightId = Date.now().toString();
    const newHighlight = {
      id: highlightId,
      text,
      comment: null,
      timestamp: new Date().toISOString(),
      range: selectionRange,
    };

    const updatedForDiscourse = [...(highlights[currentDiscourseId] || []), newHighlight];
    setHighlights(prev => ({
      ...prev,
      [currentDiscourseId]: updatedForDiscourse,
    }));

    const citation = citations.find(c => c._id === currentDiscourseId);
    if (citation) {
      await autoSaveDiscourseWithHighlights(citation, updatedForDiscourse);
    }

    window.getSelection().removeAllRanges();
    setShowHighlightPopover(false);
    setSelectedText("");
    pinnedSelectedTextRef.current = "";
    selectionFrozenRef.current = false;
    return true;
  };

  // Handle comment action
  const handleComment = async (commentText, passageText) => {
    const text = normalizeSelectionText(passageText) || resolveSelectedText();
    if (!text || !currentDiscourseId || !user) return false;

    const highlightId = Date.now().toString();
    const newHighlight = {
      id: highlightId,
      text,
      comment: commentText,
      timestamp: new Date().toISOString(),
      range: selectionRange,
    };

    const updatedForDiscourse = [...(highlights[currentDiscourseId] || []), newHighlight];
    setHighlights(prev => ({
      ...prev,
      [currentDiscourseId]: updatedForDiscourse,
    }));

    const citation = citations.find(c => c._id === currentDiscourseId);
    if (citation) {
      await autoSaveDiscourseWithHighlights(citation, updatedForDiscourse);
    }

    window.getSelection().removeAllRanges();
    setShowHighlightPopover(false);
    setSelectedText("");
    pinnedSelectedTextRef.current = "";
    selectionFrozenRef.current = false;
    return true;
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

  // The main-screen quote preview intentionally renders as plain text — we do
  // not paint the yellow highlight/comment marks here even if the discourse has
  // saved annotations. (Annotations still show inside the full discourse view.)
  const renderTextWithHighlights = (text) => text;

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
    alert("Discourse link copied to clipboard!");
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
        <div className="flex flex-col items-center justify-center mx-auto mt-6">
          <FaSpinner size={40} className="animate-spin text-orange-400" />
          <p className="mt-4 text-base text-gray-600">
            Searching for discourses to answer your question…
          </p>
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

  const { citations = [] } = reply;

  return (
    <div className="w-full mx-2">
      {/* Text Highlight Popover */}
      <TextHighlightPopover
        visible={showHighlightPopover}
        position={popoverPosition}
        selectedTextPreview={selectedText}
        onHighlight={handleHighlight}
        onComment={handleComment}
        onCommentModeChange={handleCommentModeChange}
        onClose={() => {
          selectionFrozenRef.current = false;
          setShowHighlightPopover(false);
          window.getSelection().removeAllRanges();
        }}
      />

      <div className="flex justify-end px-1 sm:px-0">
        <div className="bg-[#f5f5f5] px-4 py-3 sm:px-6 sm:py-4 w-full sm:w-auto sm:max-w-[85%] md:max-w-3/4 rounded-lg">
          <span className="text-[#252525] text-base sm:text-lg">{question}</span>
        </div>
      </div>

      {/* Assistant reply — left-aligned bubble (mobile + desktop) */}
      <div className="flex justify-start mt-3 md:mt-4 px-1 sm:px-0">
        <div className="w-full sm:max-w-[94%] md:max-w-3/4">
          <div className="rounded-2xl rounded-tl-sm bg-[#FEF4EB]/65 border border-orange-100/50 px-4 pt-4 pb-3 md:px-5 md:pt-5 md:pb-4">
            <p className="text-base sm:text-lg text-[#252525] leading-snug mb-3">
              Here are some discourses where you can start learning about the topic:
            </p>

            <div className="flex flex-col divide-y divide-orange-100/70">
              <div>
                {citations.length > 0 ? (
                  citations.map((item, index) => {
                    const discourseTitle = `${item.title} of "${item.collection}"`;
                    const isSaved = isDiscourseSaved(discourseTitle);

                    return (
                      <div
                        key={index}
                        className="text-[#252525] py-4 first:pt-0"
                      >
                        <div
                          role="link"
                          tabIndex={0}
                          onClick={() => {
                            const selected = window.getSelection()?.toString().trim();
                            if (selected) return;
                            navigate(`/blog/${item._id}`, {
                              state: { citations, questionContext: question },
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              navigate(`/blog/${item._id}`, {
                                state: { citations, questionContext: question },
                              });
                            }
                          }}
                          className="block pb-2 cursor-pointer rounded-lg hover:bg-orange-50/40 transition-colors active:bg-orange-50/30 md:px-2 md:-mx-2"
                        >
                          <p className="text-lg sm:text-xl leading-snug">
                            <span className="font-normal text-gray-500">{index + 1}.</span>{" "}
                            <span className="font-bold text-primary">{item.title}</span>
                          </p>
                          <p className="text-sm sm:text-lg text-gray-600 mt-0.5">
                            {formatCollection(item.collection)}
                          </p>
                          <p className="text-sm italic text-gray-500">{item.date}</p>

                          <div
                            className="mt-2 text-gray-800 text-base sm:text-xl italic leading-relaxed"
                            style={{ fontFamily: "'EB Garamond', serif" }}
                          >
                            <span className="text-primary">&ldquo;</span>
                            <span
                              ref={(el) => contentRefs.current[item._id] = el}
                              className="select-text"
                              style={{ WebkitUserSelect: "text", WebkitTouchCallout: "default" }}
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
                        </div>

                        <div className="flex justify-end -mr-1 sm:mr-0">
                          {/* Per-discourse actions — horizontal, 44px touch targets */}
                          <div className="flex items-center gap-1 sm:gap-2 text-primary shrink-0">
                            {user && user.token && (
                              <button
                                type="button"
                                onClick={() => handleBookmarkClick(item)}
                                title={isSaved ? "Remove from saved" : "Save discourse"}
                                aria-label={isSaved ? "Remove from saved" : "Save discourse"}
                                className="flex items-center justify-center min-h-[44px] min-w-[44px] hover:scale-110 transition-transform"
                              >
                                {isSaved ? (
                                  <BsBookmarkFill size={20} className="text-primary" />
                                ) : (
                                  <BsBookmark size={20} className="text-primary" />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              title="Copy the quote"
                              aria-label="Copy the quote"
                              className="flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleCopyQuote(item)}
                            >
                              <IoCopyOutline size={20} />
                            </button>
                            <button
                              type="button"
                              title="Copy link to this discourse"
                              aria-label="Copy link to this discourse"
                              className="flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleCopyDiscourseLink(item)}
                            >
                              <IoLinkOutline size={20} />
                            </button>
                            <button
                              type="button"
                              title="This discourse was helpful"
                              aria-label="This discourse was helpful"
                              className="flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleFeedbackClick('up', item)}
                            >
                              <IoThumbsUpOutline size={20} />
                            </button>
                            <button
                              type="button"
                              title="This discourse was not helpful"
                              aria-label="This discourse was not helpful"
                              className="flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleFeedbackClick('down', item)}
                            >
                              <IoThumbsDownOutline size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>
                    No citations found. This is usually because the search engine
                    needs more context — try asking your question again in a
                    slightly different way.
                  </p>
                )}
              </div>
            </div>
          {reply?.citations?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-orange-100/60">
              {followUps && followUps.length > 0 ? (
                <FollowUpQuestions
                  questions={followUps}
                  onQuestionClick={onFollowUpClick}
                />
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
                      Generating…
                    </>
                  ) : (
                    "Generate Followup Questions"
                  )}
                </button>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
      {showFeedbackModal && createPortal(
          <div
            className="fixed inset-0 flex justify-center items-end sm:items-center bg-black/40 z-[100] p-4 safe-area-pb"
            onClick={() => {
              setshowFeedbackModal(false);
              setFeedbackType(null);
              setFeedbackItem(null);
            }}
          >
            <div onClick={(e) => e.stopPropagation()}>
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
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
