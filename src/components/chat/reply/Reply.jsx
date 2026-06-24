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

export default function Reply({
  question = "What the user asked?",
  reply,
  loading,
  onLinkClick,
  onReloadClick,
  onCopyClick,
  onSaveDiscourse,
  onUnsaveDiscourse,
  savedDiscourses = [],
  user = null,
  onHighlightChange = () => { }, // New prop for managing highlights
}) {
  
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

  // Hydrate local highlights state from savedDiscourses so persisted highlights
  // and comments survive a browser refresh. Keyed by citation._id; matches each
  // citation to its saved discourse via the `${title} of "${collection}"` title
  // convention used elsewhere in the codebase.
  React.useEffect(() => {
    const citations = reply?.citations || [];
    if (!savedDiscourses || savedDiscourses.length === 0 || citations.length === 0) {
      return;
    }
    const hydrated = {};
    citations.forEach((citation) => {
      const discourseTitle = `${citation.title} of "${citation.collection}"`;
      const saved = savedDiscourses.find((s) => s.discourse.title === discourseTitle);
      const savedHighlights = saved?.discourse?.highlights;
      if (Array.isArray(savedHighlights) && savedHighlights.length > 0) {
        hydrated[citation._id] = savedHighlights;
      }
    });
    if (Object.keys(hydrated).length > 0) {
      setHighlights((prev) => ({ ...prev, ...hydrated }));
    }
  }, [savedDiscourses, reply]);

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

  // Auto-save discourse when highlights are added
  const autoSaveDiscourseWithHighlights = async (citation, highlightsArray) => {
    const discourseTitle = `${citation.title} of "${citation.collection}"`;
    const savedDiscourse = savedDiscourses.find(
      saved => saved.discourse.title === discourseTitle
    );

    const discourseData = {
      title: discourseTitle,
      content: citation.content,
      source_url: `/blog/${citation._id}`,
      source_citation: `${citation.date} - ${citation.collection}`,
      highlights: highlightsArray,
    };

    if (!savedDiscourse) {
      // Save new discourse with highlights
      await onSaveDiscourse(discourseData, question);
    } else {
      // Update existing saved discourse with new highlights
      try {
        const response = await fetch(apiRoute(`saved-discourses/${user.email}/${savedDiscourse.id}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`
          },
          body: JSON.stringify({
            highlights: highlightsArray
          })
        });

        if (!response.ok) {
          console.error("Failed to update highlights:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error updating highlights:", error);
      }
    }
  };

  // Remove highlight
  const handleRemoveHighlight = async (discourseId, highlightId) => {
    const updatedHighlights = (highlights[discourseId] || []).filter(h => h.id !== highlightId);

    setHighlights(prev => ({
      ...prev,
      [discourseId]: updatedHighlights
    }));

    // Update the saved discourse with new highlights
    const citation = citations.find(c => c._id === discourseId);
    if (citation) {
      await autoSaveDiscourseWithHighlights(citation, updatedHighlights);
    }
  };

  // Render text with highlights
  const renderTextWithHighlights = (text, discourseId) => {
    const discourseHighlights = highlights[discourseId] || [];

    if (discourseHighlights.length === 0) {
      return text;
    }

    // Simple implementation: wrap text in mark tags
    // TODO: Implement proper range-based highlighting
    let result = text;
    discourseHighlights.forEach((highlight, index) => {
      const highlightHtml = `<mark class="bg-yellow-200 relative group cursor-pointer" data-highlight-id="${highlight.id}">
        ${highlight.text}
        ${highlight.comment ? `<span class="hidden group-hover:block absolute bottom-full left-0 bg-blue-600 text-white text-xs p-2 rounded shadow-lg mb-1 w-48 z-10">${highlight.comment}</span>` : ''}
      </mark>`;
      result = result.replace(highlight.text, highlightHtml);
    });

    return result;
  };

  // Check if a discourse is saved
  const isDiscourseSaved = (discourseTitle) => {
    return savedDiscourses.some(saved => saved.discourse.title === discourseTitle);
  };

  // Handle bookmark click
  const handleBookmarkClick = async (citation) => {
    if (!user || !user.token) {
      alert('Please log in to save discourses');
      return;
    }

    const discourseTitle = `${citation.title} of "${citation.collection}"`;
    const isSaved = isDiscourseSaved(discourseTitle);

    if (isSaved) {
      // Find and unsave
      const savedDiscourse = savedDiscourses.find(
        saved => saved.discourse.title === discourseTitle
      );
      if (savedDiscourse) {
        await onUnsaveDiscourse(savedDiscourse.id);
      }
    } else {
      // Save discourse
      const discourseData = {
        title: discourseTitle,
        content: citation.content,
        source_url: `/blog/${citation._id}`,
        source_citation: `${citation.date} - ${citation.collection}`
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
                        </p>
                        <p className="italic">{item.date}</p>

                        {/* Best-answer quote from the discourse (single sentence,
                            selected by the backend via Cohere), shown in full */}
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
                              state={{ citations, questionContext: question }}
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
                              title="Copy link to this discourse"
                              className="cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleCopyDiscourseLink(item)}
                            />
                            <IoThumbsUpOutline
                              size={20}
                              title="This discourse was helpful"
                              className="cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleFeedbackClick('up', item)}
                            />
                            <IoThumbsDownOutline
                              size={20}
                              title="This discourse was not helpful"
                              className="cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleFeedbackClick('down', item)}
                            />
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
              <div className="flex-grow w-20"></div>
            </div>
          </div>
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
