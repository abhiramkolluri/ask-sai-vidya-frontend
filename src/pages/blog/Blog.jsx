import React, { useEffect, useState, useRef, useCallback } from "react";
import { LuPencilLine } from "react-icons/lu";
import { IoCalendar, IoBookOutline, IoChevronUp, IoChevronDown } from "react-icons/io5";
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
import {
  buildDiscourseTitle,
  findSavedDiscourseForPost,
  serializeHighlightsForSave,
  normalizeSelectionText,
  getSelectionTextInContainer,
} from "../../helpers/highlightUtils";

// Scroll an element to the middle of the viewport, animating where that works.
//
// Smooth scrolling silently NO-OPS in some Chrome configurations — measured in
// this project's own browser, where behavior:"auto" moved scrollY to 591 while
// behavior:"smooth" left it at 13, for both scrollIntoView and window.scrollTo.
// The failure is invisible: no error, the page simply never moves, which reads
// as "the jump-to-occurrence button is broken". So try the animated scroll, then
// check whether anything actually moved and repeat it instantly if not.
let pendingScrollFallback = null;

const scrollIntoViewSafely = (el) => {
  if (!el) return;
  // Cancel any fallback still pending from a previous call. Clicking "next"
  // twice inside 250ms would otherwise let the FIRST call's timer fire after the
  // second scroll and drag the reader back to the occurrence they just left —
  // measured jumping to scrollY 4320 while the active mark sat at the top.
  if (pendingScrollFallback) clearTimeout(pendingScrollFallback);
  const before = window.scrollY;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  // A smooth scroll starts moving within a frame or two, so if we are still
  // exactly where we started after this long, it is never going to happen.
  pendingScrollFallback = setTimeout(() => {
    pendingScrollFallback = null;
    if (Math.abs(window.scrollY - before) < 2) {
      el.scrollIntoView({ behavior: "auto", block: "center" });
    }
  }, 250);
};

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
    savedDiscourses,
    saveHighlights,
    getSavedDiscourseByTitle,
    deleteDiscourseRecord,
    clearAnnotations,
    loadingSaved,
  } = useSavedDiscourses();

  const citations = state?.citations?.length
    ? state.citations
    : JSON.parse(sessionStorage.getItem("blog-citations") || "null") || [];

  useEffect(() => {
    if (state?.citations?.length) {
      sessionStorage.setItem("blog-citations", JSON.stringify(state.citations));
    }
  }, [state]);

  // Citations side drawer (replaces the bulky "Other Search Results" header pill)
  const [citationsOpen, setCitationsOpen] = useState(false);

  // Highlighting state
  const [showHighlightPopover, setShowHighlightPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [activeHighlightId, setActiveHighlightId] = useState(null);
  const contentRef = useRef(null);
  const matchedRef = useRef(null); // the braces-wrapped matched passage block
  // Mobile selection: pin the passage before the OS clears it, and freeze
  // updates once the user opens the comment form (keyboard steals selection).
  const pinnedSelectedTextRef = useRef("");
  const selectionFrozenRef = useRef(false);
  const showPopoverRef = useRef(false);
  showPopoverRef.current = showHighlightPopover;

  // Keyword-route highlighting: one ref per rendered <mark>, in document order,
  // plus which occurrence the find-in-page control is currently sitting on.
  // These live up here with the other hooks because the render body below has
  // early returns for the loading and error states.
  const markRefs = useRef([]);
  const [activeMark, setActiveMark] = useState(0);
  // Dismissing the find-in-page pill clears the marks for this discourse only,
  // and resets on navigation (below). Deliberately NOT sticky for the session:
  // there is no control to switch highlighting back on, so a sticky dismissal
  // would strand the reader with no way to recover it.
  const [keywordDismissed, setKeywordDismissed] = useState(false);

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
    setSelectedText("");
    pinnedSelectedTextRef.current = "";
    selectionFrozenRef.current = false;
    // Without this, jumping between discourses in the citations drawer lands on
    // the previous document's occurrence index.
    setActiveMark(0);
    markRefs.current = [];
    setKeywordDismissed(false);
  }, [slugId]);

  // When a discourse is opened from a citation, scroll the matched passage into
  // view once it has rendered, so the answer is shown immediately.
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => {
      scrollIntoViewSafely(matchedRef.current);
    }, 150);
    return () => clearTimeout(t);
  }, [data, slugId]);

  // Load saved discourse highlights for this blog post
  useEffect(() => {
    if (!data || data._id !== slugId || loadingSaved) return;

    // Resolves duplicate saved rows by preferring the most-annotated record,
    // rather than trusting a single title lookup.
    const savedDiscourse = findSavedDiscourseForPost(
      data,
      savedDiscourses,
      getSavedDiscourseByTitle
    );
    setHighlights(savedDiscourse?.discourse?.highlights || []);
  }, [slugId, data, loadingSaved, savedDiscourses, getSavedDiscourseByTitle]);

  // Handle text selection (desktop mouseup + shared opener for mobile)
  const handleTextSelection = () => {
    if (selectionFrozenRef.current) return;
    const contentContainer = contentRef.current;
    if (!contentContainer || !user || !user.token) return;

    const text =
      getSelectionTextInContainer(contentContainer) ||
      normalizeSelectionText(window.getSelection()?.toString());
    if (!text) {
      if (!showPopoverRef.current) setShowHighlightPopover(false);
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = contentContainer.getBoundingClientRect();
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (isDesktop) {
        setPopoverPosition({
          x: containerRect.right + 20,
          y: rect.top,
        });
      }
    }

    setSelectedText(text);
    pinnedSelectedTextRef.current = text;
    setShowHighlightPopover(true);
  };

  const handleCommentModeChange = useCallback((frozen) => {
    selectionFrozenRef.current = frozen;
    if (frozen) {
      const text =
        getSelectionTextInContainer(contentRef.current) ||
        normalizeSelectionText(window.getSelection()?.toString()) ||
        pinnedSelectedTextRef.current ||
        selectedText;
      if (text) {
        pinnedSelectedTextRef.current = text;
        setSelectedText(text);
      }
    }
  }, [selectedText]);

  // Mobile text selection: mouseup often never fires after a touch selection.
  // Listen for selectionchange, wait for the user to finish adjusting handles,
  // then open the bottom sheet. Freeze once comment mode opens.
  useEffect(() => {
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

        const container = contentRef.current;
        if (!container) return;
        if (!container.contains(selection.getRangeAt(0).commonAncestorContainer)) {
          return;
        }

        const text = getSelectionTextInContainer(container);
        if (!text) return;

        setSelectedText(text);
        pinnedSelectedTextRef.current = text;
        setShowHighlightPopover(true);
      }, delay);
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      if (timer) clearTimeout(timer);
    };
  }, [user]);

  // Hide popover on scroll — desktop only. On mobile, scroll events fire while
  // dragging selection handles and would immediately dismiss the sheet.
  useEffect(() => {
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }
    const handleScroll = () => {
      if (showHighlightPopover) {
        setShowHighlightPopover(false);
        window.getSelection().removeAllRanges();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showHighlightPopover]);

  // Handle highlight action. The popover passes back the passage it captured
  // when the selection was made, because the live browser selection (and thus
  // our selectedText state) can be gone by the time the button is clicked.
  const handleHighlight = async (passageText) => {
    const text = normalizeSelectionText(
      passageText || selectedText || pinnedSelectedTextRef.current
    );
    if (!text || !user || !data) return false;

    const highlightId = Date.now().toString();
    const newHighlight = {
      id: highlightId,
      text,
      comment: null,
      timestamp: new Date().toISOString(),
    };

    const previousHighlights = Array.isArray(highlights) ? highlights : [];
    const updatedHighlights = [...previousHighlights, newHighlight];
    setHighlights(updatedHighlights);

    const saved = await saveDiscourseWithHighlights(updatedHighlights);
    if (!saved) {
      setHighlights(previousHighlights);
      return false;
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
    const text = normalizeSelectionText(
      passageText || selectedText || pinnedSelectedTextRef.current
    );
    if (!text || !user || !data) return false;

    const highlightId = Date.now().toString();
    const newHighlight = {
      id: highlightId,
      text,
      comment: commentText,
      timestamp: new Date().toISOString(),
    };

    const previousHighlights = Array.isArray(highlights) ? highlights : [];
    const updatedHighlights = [...previousHighlights, newHighlight];
    setHighlights(updatedHighlights);

    const saved = await saveDiscourseWithHighlights(updatedHighlights);
    if (!saved) {
      setHighlights(previousHighlights);
      return false;
    }

    window.getSelection().removeAllRanges();
    setShowHighlightPopover(false);
    setSelectedText("");
    pinnedSelectedTextRef.current = "";
    selectionFrozenRef.current = false;
    return true;
  };

  // Save or update discourse with highlights
  const saveDiscourseWithHighlights = async (highlightsArray) => {
    if (!user || !user.token || !data) return false;

    const discourseTitle = buildDiscourseTitle(data.title, data.collection);
    const existingSaved = findSavedDiscourseForPost(
      data,
      savedDiscourses,
      getSavedDiscourseByTitle
    );

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

    // Strip DOM range snapshots and other non-JSON-safe fields before persisting.
    const result = await saveHighlights(
      discourseData,
      serializeHighlightsForSave(highlightsArray)
    );
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

  // Helper function to render text with active highlight.
  //
  // `transform` is applied to every plain-text segment this produces, so a
  // second highlighter can compose with this one instead of replacing it — the
  // keyword-route marker passes itself in here. Defaults to identity, which is
  // exactly the previous behaviour. Without this, turning on keyword marking
  // would silently break clicking a saved highlight in HighlightsSidebar.
  const renderContentWithHighlight = (text, transform = (t) => t) => {
    if (!activeHighlightId) return transform(text);

    const activeHighlight = highlights.find(h => h.id === activeHighlightId);
    if (!activeHighlight) return transform(text);

    const highlightText = activeHighlight.text;
    const index = text.indexOf(highlightText);

    if (index === -1) return transform(text);

    // Split text and add animated highlight
    const before = text.substring(0, index);
    const highlight = text.substring(index, index + highlightText.length);
    const after = text.substring(index + highlightText.length);

    return (
      <>
        {transform(before)}
        <span className="bg-orange-300 animate-pulse px-1 rounded transition-all duration-300">
          {transform(highlight)}
        </span>
        {transform(after)}
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

    // Right-edge drawer contents:
    // - From Collections → other discourses in the same book/section
    // - From search → the other matched citations for this question
    const isCollectionReader = Boolean(navBook && chapterList.length > 0);
    const sidebarItems = isCollectionReader
      ? chapterList.map((ch) => ({
          _id: ch.id,
          title: ch.title,
          collection: navBook,
          date: ch.date || "",
          chapter_index: ch.chapter_index,
        }))
      : citations;
    const sidebarLabel = isCollectionReader ? "In this collection" : "Citations";
    const chaptersQS = searchParams.toString();

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

    // The searched term, when this discourse was surfaced by the KEYWORD route.
    // Same precedence as bestSentence above: router state, then sessionStorage
    // for the refresh / direct-URL case. Absent means every keyword code path
    // below is skipped and the best-sentence behaviour stands unchanged.
    let keywordSource = state?.keywordTerm || "";
    if (!keywordSource) {
      try {
        const tmap = JSON.parse(
          sessionStorage.getItem("asv_keyword_terms") || "{}"
        );
        keywordSource = tmap[slugId] || tmap[post._id] || "";
      } catch (e) {
        /* sessionStorage unavailable — non-fatal */
      }
    }
    // Two variables, because dismissing the pill must clear the highlighting
    // WITHOUT falling back to the best-sentence mark — swapping 24 marks for a
    // different one is not what "end the highlighting" means. `keywordSource`
    // answers "did this arrive from a keyword search" (so the best-sentence path
    // stays suppressed either way); `keywordTerm` answers "should we be marking
    // right now".
    const keywordTerm = keywordDismissed ? "" : keywordSource;

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

    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // --- Keyword-route highlighting -------------------------------------
    // When the user searched a bare term, every occurrence of it is marked
    // rather than the one sentence a reranker liked best. Whole words only:
    // "karma" marks the Karma in "Karma-Yoga" but not "karmic", which is what
    // BM25 actually matched (it tokenizes on word boundaries) and avoids
    // leaving words visually broken mid-way.
    //
    // \b rather than lookbehind/lookahead assertions — Safari only gained
    // lookbehind in 16.4. Tokens are joined by [^\w]+ so "inner peace" also
    // matches "inner, peace", mirroring retrieval.py::phrase_in_text.
    const keywordTokens = keywordTerm
      ? keywordTerm.trim().split(/\s+/).filter(Boolean).map(escapeRegExp)
      : [];
    const keywordRe = keywordTokens.length
      ? new RegExp(`\\b${keywordTokens.join("[^\\w]+")}\\b`, "gi")
      : null;

    // Counted in a separate pass, before any rendering, because the navigator
    // pill sits ABOVE the content in the JSX tree and needs the total then.
    let keywordCount = 0;
    if (keywordRe) {
      contentLines.forEach((line) => {
        keywordCount += (line.match(keywordRe) || []).length;
      });
    }
    // Drop refs left over from a longer previous document so goToMark can never
    // scroll to a detached node. Safe to do during render: the callback refs
    // below repopulate this after the commit.
    markRefs.current.length = keywordCount;

    // Document-order index handed to each mark as it is created. Rendering is
    // synchronous and in order, so this stays in step with the count above.
    let markCursor = 0;

    // Split one line into text/<mark>/text React nodes. Never builds an HTML
    // string — Reply.jsx:238 does an unescaped .replace() into
    // dangerouslySetInnerHTML, which is not a pattern to copy into a page that
    // renders arbitrary corpus text.
    const markKeyword = (text) => {
      if (!keywordRe || !text) return text;
      keywordRe.lastIndex = 0; // shared /g regex — reset per segment
      const nodes = [];
      let last = 0;
      let m;
      while ((m = keywordRe.exec(text)) !== null) {
        const i = markCursor++;
        if (m.index > last) nodes.push(text.slice(last, m.index));
        nodes.push(
          <mark
            key={`kw-${i}`}
            // The first mark also carries matchedRef, which the existing scroll
            // effect targets — that is what lands the reader on occurrence 1.
            ref={(el) => {
              markRefs.current[i] = el;
              if (i === 0) matchedRef.current = el;
            }}
            // The page's own light orange (#FE9F44 — the hero tint and the
            // citation-card hover) rather than a yellow highlighter. The active
            // occurrence is the solid brand orange; the rest are the same hue
            // washed back, so they read as one family and not as two colours.
            className={
              i === activeMark
                ? "bg-[#FE9F44] rounded px-0.5"
                : "bg-[#FE9F4459] rounded px-0.5"
            }
          >
            {m[0]}
          </mark>
        );
        last = m.index + m[0].length;
        if (m[0].length === 0) keywordRe.lastIndex++; // guard against zero-width loops
      }
      if (!nodes.length) return text;
      if (last < text.length) nodes.push(text.slice(last));
      return nodes;
    };

    const renderLine = (text, index) => (
      <React.Fragment key={index}>
        {text.includes(". ") ? (
          <p className="mb-4">{renderContentWithHighlight(text, markKeyword)}</p>
        ) : (
          <h3 className="text-lg mb-4">
            <strong>{renderContentWithHighlight(text, markKeyword)}</strong>
          </h3>
        )}
      </React.Fragment>
    );

    // Move to another occurrence. `next` is computed before setState because
    // setActiveMark is async — reading activeMark back after the call would
    // scroll to the occurrence we just left. Wraps in both directions.
    const goToMark = (delta) => {
      if (!keywordCount) return;
      const next = (activeMark + delta + keywordCount) % keywordCount;
      setActiveMark(next);
      scrollIntoViewSafely(markRefs.current[next]);
    };

    // Locate the best-answer quote within the matched paragraph range so we can
    // highlight just those sentences (and scroll to them) instead of the whole
    // paragraph. Whitespace-tolerant, mirroring the backend's verbatim check.
    // Skipped entirely on the keyword route: it competes for matchedRef and
    // re-introduces exactly the single-sentence emphasis being replaced. Keyed on
    // keywordSource so dismissing the pill does not resurrect it.
    let quoteLineIndex = -1;
    let quoteParts = null;
    if (!keywordSource && bestSentence && matchStart !== -1) {
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
        {/* Find-in-page control for a keyword search. Fixed rather than placed in
            the page header: the header is a 375px hero that scrolls away, and a
            "next" button you have to scroll back up to reach is no use. */}
        {keywordTerm && keywordCount > 0 && (
          <div className="fixed top-4 right-4 z-40 flex items-center gap-3 rounded-full border border-orange-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
            <span className="text-sm text-gray-700">
              &ldquo;{keywordTerm}&rdquo;
            </span>
            <span className="text-sm tabular-nums text-gray-500">
              {activeMark + 1} of {keywordCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goToMark(-1)}
                aria-label="Previous occurrence"
                className="rounded-full p-1 text-gray-600 hover:bg-orange-100 hover:text-orange-600"
              >
                <IoChevronUp size={18} />
              </button>
              <button
                type="button"
                onClick={() => goToMark(1)}
                aria-label="Next occurrence"
                className="rounded-full p-1 text-gray-600 hover:bg-orange-100 hover:text-orange-600"
              >
                <IoChevronDown size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setKeywordDismissed(true)}
              aria-label="Stop highlighting"
              title="Stop highlighting"
              className="rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-700 border-l border-gray-200 pl-2 ml-1"
            >
              <MdClose size={16} />
            </button>
          </div>
        )}

        {/* Text Highlight Popover */}
        <TextHighlightPopover
          visible={showHighlightPopover}
          position={popoverPosition}
          selectedTextPreview={selectedText || pinnedSelectedTextRef.current}
          onHighlight={handleHighlight}
          onComment={handleComment}
          onCommentModeChange={handleCommentModeChange}
          onClose={() => {
            selectionFrozenRef.current = false;
            setShowHighlightPopover(false);
            pinnedSelectedTextRef.current = "";
            window.getSelection().removeAllRanges();
          }}
        />

        <div className="w-full min-h-[240px] sm:min-h-[320px] md:h-[375px] flex flex-col bg-[#FE9F440A] items-center">
          <div className="p-4 sm:p-6 md:p-9 flex flex-col gap-3 w-full max-w-[1400px]">
            <div className="flex items-center justify-between gap-3">
              <Logo />
              <div className="min-w-0 shrink-0">
                <Navbar variant="blog" />
              </div>
            </div>
            {user?.token && (
              <div className="flex justify-start">
                <HighlightsSidebar
                  highlights={highlights}
                  onHighlightClick={handleHighlightClick}
                  onRemoveHighlight={handleRemoveHighlight}
                  activeHighlightId={activeHighlightId}
                />
              </div>
            )}
          </div>
          <h1 className="text-lg sm:text-xl md:text-[22px] text-center font-bold mb-4 px-4 max-w-3xl">
            {post?.title}
          </h1>

          <Link to="/home">
            {/* Styled as a twin of the header pills rather than a filled CTA. */}
            <button className="flex items-center gap-2 px-4 py-2 mb-2 rounded-lg shadow-sm transition-all border-[1.5px] bg-white border-orange-200/80 hover:bg-orange-50">
              <LuPencilLine size={18} className="text-orange-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                Return to Search
              </span>
            </button>
          </Link>
          <div>
            <img src={bgflower} alt="" className="w-full " />
          </div>
        </div>
        <div className="flex flex-wrap md:flex-nowrap justify-center items-start w-[96vw] max-w-[1400px] mx-auto md:gap-4 gap-4 leading-8 px-3 sm:px-4">
          <div className="flex flex-col w-full md:w-[800px] md:flex-shrink-0 border border-gray-300 rounded shadow p-4 sm:p-6 md:p-8 gap-6 sm:gap-8 relative -top-12 sm:-top-16 md:-top-20 bg-white">
            {chapterNav && (
              <div className="flex justify-center border-b border-orange-100 pb-2 -mb-4">
                {chapterNav}
              </div>
            )}
            <h2 className="text-lg sm:text-[20px] mt-2 sm:mt-4 text-center font-bold text-[#4D4D4D]">
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
            <div className="p-2 sm:p-4 md:p-8 flex flex-col gap-6 sm:gap-8" ref={contentRef}>
              {/* Content with text selection enabled - Added padding bottom for scroll space */}
              <div
                onMouseUp={handleTextSelection}
                className="select-text cursor-text pb-[30vh] sm:pb-[40vh] md:pb-[50vh]"
                style={{ WebkitUserSelect: "text", WebkitTouchCallout: "default" }}
              >
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
                  // gently highlight it and anchor the scroll there. Not on the
                  // keyword route, where matchedRef belongs to the first occurrence.
                  if (!keywordSource && quoteLineIndex === -1 && index === matchStart) {
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
        </div>

        {/* Floating side tab — search citations, or sibling chapters in a collection */}
        {sidebarItems.length > 0 && (
          <button
            type="button"
            onClick={() => setCitationsOpen(true)}
            className="fixed top-1/2 -translate-y-1/2 right-0 z-40 flex items-center gap-2 bg-white border border-gray-200 shadow-lg px-2 sm:px-3 py-3 sm:py-4 rounded-l-xl text-orange-400 hover:bg-orange-50 transition-colors"
            aria-label={`Open ${sidebarLabel} (${sidebarItems.length})`}
          >
            <TbLayoutSidebarRightExpand size={20} style={{ transform: "rotate(180deg)" }} />
            <span
              className="text-[10px] sm:text-xs font-semibold tracking-wide text-gray-600"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              {sidebarLabel} ({sidebarItems.length})
            </span>
          </button>
        )}

        {/* Side drawer */}
        <div
          className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
            citationsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <button
            type="button"
            aria-label={`Close ${sidebarLabel}`}
            tabIndex={citationsOpen ? 0 : -1}
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              citationsOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setCitationsOpen(false)}
          />

          <div
            className={`relative w-full max-w-sm md:max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-out safe-area-pt ${
              citationsOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
            }`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setCitationsOpen(false)}
                className="p-2 -ml-2 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <MdClose size={22} />
              </button>
              <h2 className="text-sm font-semibold text-gray-700">
                {sidebarLabel} ({sidebarItems.length})
              </h2>
              <div className="w-6" />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {sidebarItems.map((c, i) => {
                const lookupTitle = `${c.title} of "${c.collection}"`;
                const savedDiscourse = getSavedDiscourseByTitle(lookupTitle);
                const recentHighlights =
                  user && savedDiscourse?.discourse?.highlights
                    ? [...savedDiscourse.discourse.highlights]
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .slice(0, 3)
                    : [];
                const isActive = slugId === c._id;
                const chapterNum =
                  typeof c.chapter_index === "number" ? c.chapter_index + 1 : null;
                const href = isCollectionReader
                  ? `/blog/${c._id}?${chaptersQS}`
                  : `/blog/${c._id}`;

                return (
                  <Link
                    key={c._id || i}
                    to={href}
                    state={
                      isCollectionReader
                        ? undefined
                        : { citations, questionContext: state?.questionContext }
                    }
                    onClick={() => setCitationsOpen(false)}
                  >
                    <div
                      className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
                        isActive
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-200 hover:bg-orange-50/50"
                      }`}
                    >
                      <p
                        className={`font-medium text-sm ${
                          isActive ? "text-orange-600" : "text-gray-800"
                        }`}
                      >
                        {chapterNum != null ? `${chapterNum}. ` : ""}
                        {c.title}
                      </p>

                      <div className="flex flex-col gap-1">
                        {c.collection && (
                          <div className="flex gap-2 items-center text-xs text-gray-500">
                            <IoMdList size={14} className="text-orange-400 shrink-0" />
                            <span>{c.collection.replace(/(\d)(Disc\.)/g, "$1 $2")}</span>
                          </div>
                        )}
                        {c.date && (
                          <div className="flex gap-2 items-center text-xs text-gray-500">
                            <IoCalendar size={14} className="text-orange-400 shrink-0" />
                            <span>{c.date}</span>
                          </div>
                        )}
                      </div>

                      {recentHighlights.length > 0 && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500">
                            Your highlights
                            {savedDiscourse.discourse.highlights.length > 3
                              ? ` (showing 3 of ${savedDiscourse.discourse.highlights.length})`
                              : ""}
                          </p>
                          {recentHighlights.map((h) => (
                            <div key={h.id} className="flex flex-col gap-1">
                              <div className="bg-yellow-100 rounded px-2 py-1">
                                <p className="text-xs text-gray-700 line-clamp-2">
                                  "{h.text.substring(0, 80)}
                                  {h.text.length > 80 ? "…" : ""}"
                                </p>
                              </div>
                              {h.comment && (
                                <p className="text-xs text-gray-600 pl-2 border-l-2 border-orange-300">
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
      </div>
    );
  }
}
