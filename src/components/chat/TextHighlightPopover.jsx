import React, { useState, useEffect, useRef } from 'react';
import { MdHighlight, MdOutlineComment, MdClose } from 'react-icons/md';

/**
 * Google Docs-style popover for text highlighting and commenting
 * Appears when user selects text in discourse content
 */
export default function TextHighlightPopover({
    visible = false,
    position = { x: 0, y: 0 },
    onHighlight = () => { },
    onComment = () => { },
    onClose = () => { },
    showCommentInput = false,
    initialComment = '',
}) {
    const [comment, setComment] = useState(initialComment);
    const [isCommentMode, setIsCommentMode] = useState(showCommentInput);
    const popoverRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        setComment(initialComment);
        setIsCommentMode(showCommentInput);
    }, [initialComment, showCommentInput]);

    useEffect(() => {
        if (isCommentMode && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isCommentMode]);

    const handleHighlightClick = () => {
        onHighlight();
        setIsCommentMode(false);
        onClose();
    };

    const handleCommentButtonClick = () => {
        setIsCommentMode(true);
    };

    const handleCommentSubmit = () => {
        if (comment.trim()) {
            onComment(comment.trim());
            setComment('');
            setIsCommentMode(false);
            onClose();
        }
    };

    const handleCancel = () => {
        setComment('');
        setIsCommentMode(false);
        onClose();
    };

    if (!visible) return null;

    return (
        <div
            ref={popoverRef}
            className="fixed z-50"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            {/* Arrow pointing left to the selected text */}
            <div
                className="absolute left-0 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white"
                style={{
                    transform: 'translateX(-8px)',
                    filter: 'drop-shadow(-1px 0 1px rgba(0,0,0,0.1))'
                }}
            />

            {/* Main popover content */}
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200">
                {!isCommentMode ? (
                    // Button mode
                    <div className="flex items-center gap-1 p-1">
                        <button
                            onClick={handleHighlightClick}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-yellow-50 rounded transition-colors"
                            title="Highlight text"
                        >
                            <MdHighlight size={18} className="text-yellow-600" />
                            <span className="text-sm text-gray-700">Highlight</span>
                        </button>

                        <div className="w-px h-6 bg-gray-300" />

                        <button
                            onClick={handleCommentButtonClick}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded transition-colors"
                            title="Add comment"
                        >
                            <MdOutlineComment size={18} className="text-blue-600" />
                            <span className="text-sm text-gray-700">Comment</span>
                        </button>
                    </div>
                ) : (
                    // Comment input mode
                    <div className="p-3 w-80">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Add Comment</span>
                            <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <MdClose size={18} />
                            </button>
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Type your comment here..."
                            className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows={3}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCommentSubmit();
                                } else if (e.key === 'Escape') {
                                    handleCancel();
                                }
                            }}
                        />

                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={handleCancel}
                                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCommentSubmit}
                                disabled={!comment.trim()}
                                className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
