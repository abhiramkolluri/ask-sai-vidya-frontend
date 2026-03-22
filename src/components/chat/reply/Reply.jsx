import React, { useState, useRef } from "react";
import {
  IoCopyOutline,
  IoReload,
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
  console.log("hi guys shreyas here too")

  console.log("Reply component received reply:", reply);
  const [showFeedbackModal, setshowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null); // 'up' or 'down'
  const [isReloading, setIsReloading] = useState(false);

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
        const response = await fetch(apiRoute(`saved-discourses/${savedDiscourse.id}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`
          },
          body: JSON.stringify({
            user_email: user.email,
            highlights: highlightsArray
          })
        });

        if (!response.ok) {
          console.error("Failed to update highlights:", response.statusText);
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
                      <div key={index} className="text-[#252525] mb-6 relative">
                        {/* Bookmark button */}
                        {user && user.token && (
                          <button
                            onClick={() => handleBookmarkClick(item)}
                            className="absolute top-0 right-0 text-primary hover:scale-110 transition-transform"
                            title={isSaved ? "Remove from saved" : "Save discourse"}
                          >
                            {isSaved ? (
                              <BsBookmarkFill size={20} className="text-primary" />
                            ) : (
                              <BsBookmark size={20} className="text-primary" />
                            )}
                          </button>
                        )}

                        <p className="">
                          <span className="text-primary">
                            [{index + 1}] {"\t\t"}
                          </span>
                          <span className="font-lg font-bold ">
                            {item.title} of "{item.collection}"
                          </span>
                        </p>
                        <p className="italic">{item.date}</p>

                        {/* Discourse content with text selection support */}
                        <div
                          ref={(el) => contentRefs.current[item._id] = el}
                          className="p-2 ml-3 select-text"
                          onMouseUp={() => handleTextSelection(item._id)}
                          dangerouslySetInnerHTML={{
                            __html: renderTextWithHighlights(
                              item.content.length > 200
                                ? item.content.slice(0, 200) + "..."
                                : item.content,
                              item._id
                            )
                          }}
                        />

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

                        <br />
                        <span className="text-primary underline">
                          <Link
                            to={`/blog/${item._id}`}
                            state={{ citations, questionContext: question }}
                            className="flex"
                            onClick={handleSeeMore}
                          >
                            See more
                            <GoArrowUpRight size={20} />
                          </Link>
                        </span>
                      </div>
                    );
                  })
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
              className="cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => onCopyClick(primaryResponse)}
            />
            <IoLinkOutline
              size={20}
              className="cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => onLinkClick(question)}
            />
            <IoThumbsUpOutline
              size={20}
              className="cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => handleFeedbackClick('up')}
            />
            <IoThumbsDownOutline
              size={20}
              className="cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => handleFeedbackClick('down')}
            />
            {isReloading ? (
              <div className="animate-spin">
                <FaSpinner size={20} />
              </div>
            ) : (
              <IoReload
                size={20}
                className="cursor-pointer hover:opacity-70 transition-opacity"
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
