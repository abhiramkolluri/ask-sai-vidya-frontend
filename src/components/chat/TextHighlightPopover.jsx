import React, { useState, useEffect, useRef } from 'react';
import { MdHighlight, MdOutlineComment, MdClose } from 'react-icons/md';

function ActionButtons({ onHighlight, onComment, className = '' }) {
  return (
    <div className={`flex items-center gap-1 p-1 ${className}`}>
      <button
        type="button"
        onClick={onHighlight}
        className="flex flex-1 lg:flex-none items-center justify-center gap-2 px-3 py-2.5 hover:bg-orange-50 rounded-lg transition-colors"
        title="Highlight text"
      >
        <MdHighlight size={18} className="text-orange-500" />
        <span className="text-sm text-gray-700 font-medium">Highlight</span>
      </button>

      <div className="w-px h-6 bg-gray-300" />

      <button
        type="button"
        onClick={onComment}
        className="flex flex-1 lg:flex-none items-center justify-center gap-2 px-3 py-2.5 hover:bg-orange-50 rounded-lg transition-colors"
        title="Add comment"
      >
        <MdOutlineComment size={18} className="text-orange-600" />
        <span className="text-sm text-gray-700 font-medium">Comment</span>
      </button>
    </div>
  );
}

function CommentForm({
  comment,
  setComment,
  textareaRef,
  onCancel,
  onSubmit,
  className = '',
  hideCloseButton = false,
  saving = false,
  saveError = '',
}) {
  return (
    <div className={`p-3 w-full lg:w-80 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Add Comment</span>
        {!hideCloseButton && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <MdClose size={16} />
          </button>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Type your comment here..."
        className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base leading-snug"
        rows={3}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
      />

      {saveError && (
        <p className="text-xs text-red-600 mt-2 leading-snug">{saveError}</p>
      )}

      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!comment.trim() || saving}
          className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/**
 * Google Docs-style popover for text highlighting and commenting.
 * Desktop (lg+): floating card in the right margin.
 * Mobile / tablet: bottom action sheet; on sm+ widths it becomes a centered card.
 */
export default function TextHighlightPopover({
  visible = false,
  position = { x: 0, y: 0 },
  onHighlight = () => { },
  onComment = () => { },
  onClose = () => { },
  onCommentModeChange = () => { },
  showCommentInput = false,
  initialComment = '',
  selectedTextPreview = '',
}) {
  const [comment, setComment] = useState(initialComment);
  const [isCommentMode, setIsCommentMode] = useState(showCommentInput);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const popoverRef = useRef(null);
  const textareaRef = useRef(null);
  const passageSnapshotRef = useRef("");

  useEffect(() => {
    if (selectedTextPreview) {
      passageSnapshotRef.current = selectedTextPreview;
    }
  }, [selectedTextPreview]);

  useEffect(() => {
    if (visible && selectedTextPreview) {
      passageSnapshotRef.current = selectedTextPreview;
    }
  }, [visible, selectedTextPreview]);

  useEffect(() => {
    setComment(initialComment);
    setIsCommentMode(showCommentInput);
  }, [initialComment, showCommentInput, visible]);

  useEffect(() => {
    if (!visible) {
      setComment('');
      setIsCommentMode(false);
      setSaving(false);
      setSaveError('');
      passageSnapshotRef.current = '';
      onCommentModeChange(false);
    }
  }, [visible, onCommentModeChange]);

  useEffect(() => {
    if (isCommentMode) {
      onCommentModeChange(true);
    }
  }, [isCommentMode, onCommentModeChange]);

  useEffect(() => {
    if (isCommentMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isCommentMode]);

  // Clamp desktop popover within viewport bounds after every render
  useEffect(() => {
    if (!visible || !popoverRef.current) return;
    const el = popoverRef.current;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      el.style.left = `${window.innerWidth - rect.width - 8}px`;
    }
    if (rect.bottom > window.innerHeight - 8) {
      el.style.top = `${window.innerHeight - rect.height - 8}px`;
    }
  }, [visible, isCommentMode]);

  const handleHighlightClick = async () => {
    if (saving) return;
    const passage = passageSnapshotRef.current || selectedTextPreview;
    if (!passage?.trim()) {
      setSaveError("No text selected. Drag the handles to select a passage first.");
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const ok = await onHighlight(passage);
      if (ok === false) {
        setSaveError('Could not save highlight. Please try again.');
        return;
      }
      setIsCommentMode(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleCommentButtonClick = () => {
    passageSnapshotRef.current = selectedTextPreview || passageSnapshotRef.current;
    onCommentModeChange(true);
    setSaveError('');
    setIsCommentMode(true);
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim() || saving) return;
    const passage = passageSnapshotRef.current || selectedTextPreview;
    if (!passage?.trim()) {
      setSaveError("No text selected. Close and re-select the passage first.");
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const ok = await onComment(comment.trim(), passage);
      if (ok === false) {
        setSaveError('Could not save comment. Please try again.');
        return;
      }
      setComment('');
      setIsCommentMode(false);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setComment('');
    setIsCommentMode(false);
    onClose();
  };

  const previewText =
    selectedTextPreview.length > 120
      ? `${selectedTextPreview.substring(0, 120)}...`
      : selectedTextPreview;

  const showSheetBackdrop = visible && isCommentMode;

  return (
    <>
      {/* Mobile / tablet / small laptop (< lg): bottom sheet.
          Layer stays mounted; opacity/transform transitions avoid iOS Safari
          ghost paint from unmounting fixed overlays. */}
      <div
        className={`lg:hidden fixed inset-0 z-50 flex flex-col justify-end pointer-events-none transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          type="button"
          aria-label="Dismiss"
          tabIndex={showSheetBackdrop ? 0 : -1}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            showSheetBackdrop ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={handleCancel}
        />

        <div
          className={`relative w-full bg-white shadow-2xl border-t border-gray-200 font-ui transition-transform duration-300 ease-out rounded-t-2xl safe-area-pb ${
            visible
              ? 'translate-y-0 pointer-events-auto'
              : 'translate-y-full pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="w-6" aria-hidden="true" />
            <div className="w-10 h-1 rounded-full bg-gray-300" aria-hidden="true" />
            <button
              type="button"
              onClick={handleCancel}
              tabIndex={visible ? 0 : -1}
              className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
              aria-label="Close"
            >
              <MdClose size={16} />
            </button>
          </div>

          {previewText && (
            <blockquote className="mx-4 mb-2 px-3 py-2 border-l-2 border-orange-300 bg-orange-50/80 rounded-r-lg">
              <p className="text-xs text-gray-500 mb-0.5">Selected text</p>
              <p className="text-sm text-gray-700 leading-snug line-clamp-5 italic whitespace-pre-wrap break-words">
                "{previewText}"
              </p>
            </blockquote>
          )}

          {!isCommentMode ? (
            <>
              <p className="px-4 mb-2 text-[11px] text-gray-400 leading-snug">
                Drag the handles to adjust your selection, then tap an action.
              </p>
              <ActionButtons
                onHighlight={handleHighlightClick}
                onComment={handleCommentButtonClick}
                className="px-3 pb-4"
              />
            </>
          ) : (
            <CommentForm
              comment={comment}
              setComment={setComment}
              textareaRef={textareaRef}
              onCancel={handleCancel}
              onSubmit={handleCommentSubmit}
              hideCloseButton
              saving={saving}
              saveError={saveError}
            />
          )}
        </div>
      </div>

      {/* Desktop (lg+): floating popover in the right margin */}
      {visible && (
        <div
          ref={popoverRef}
          className="hidden lg:block fixed z-50"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <div
            className="absolute left-0 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-white"
            style={{
              transform: 'translateX(-8px)',
              filter: 'drop-shadow(-1px 0 1px rgba(0,0,0,0.1))',
            }}
          />

          <div className="bg-white rounded-lg shadow-2xl border border-gray-200">
            {!isCommentMode ? (
              <ActionButtons
                onHighlight={handleHighlightClick}
                onComment={handleCommentButtonClick}
              />
            ) : (
              <CommentForm
                comment={comment}
                setComment={setComment}
                textareaRef={textareaRef}
                onCancel={handleCancel}
                onSubmit={handleCommentSubmit}
                saving={saving}
                saveError={saveError}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
