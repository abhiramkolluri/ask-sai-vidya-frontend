import React, { useState, useEffect, useRef } from "react";
import { RiSendPlane2Fill, RiSendPlane2Line } from "react-icons/ri";
import SampleQuestions from "../sample/SampleQuestions";
import Reply from "../chat/reply/Reply";
import DecorativeBackground from "../common/DecorativeBackground";
import { apiRoute } from "../../helpers/apiRoute";

const cache = {};

export default function ChatBox({
  newChat,
  selectedThreadId = null,
  setSelectedThreadId = () => { },
  addThread = () => { },
  threads = [],
  user = null,
  generateTitleFromQuestion = (question) => question || "New Chat",
  loadThreadMessages = async () => [],
  savedDiscourses = [],
  onSaveDiscourse = async () => { },
  onUnsaveDiscourse = async () => { },
}) {
  const [messages, setMessages] = useState([]);
  const [askQuestion, setAskQuestion] = useState("");
  const [loadingIndex, setLoadingIndex] = useState(null); // Track loading for specific question
  const [followupLoadingIndex, setFollowupLoadingIndex] = useState(null); // Track follow-up generation per message
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessageCount = useRef(0);

  const fetchPrimaryResponse = async (question) => {
    if (cache[question]?.primaryResponse) {
      return {
        response: cache[question].primaryResponse,
        fetchCitations: cache[question].fetchCitations,
      };
    }

    const url = apiRoute("query");
    console.log("🔍 Frontend calling URL:", url);
    console.log("🔍 Environment variable:", process.env.REACT_APP_BASE_API_SERVER);

    const headers = {
      "Content-Type": "application/json",
    };

    // Add Authorization header if user is logged in
    if (user && user.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    const requestBody = { query: question };

    // Add user email to request body if available
    if (user && user.email) {
      requestBody.user_email = user.email;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });
    console.log("🔍 Response status:", response.status);
    const data = await response.json();
    console.log("🔍 Response data:", data);
    const fetchCitations =
      data.response !==
      "It seems like there might be a misunderstanding with the question you provided. I'm here to offer spiritual guidance based on the teachings of Sathya Sai Baba. If you have any questions related to spirituality, personal growth, or Sai Baba's teachings, feel free to ask!";
    cache[question] = {
      ...cache[question],
      primaryResponse: data.response,
      fetchCitations,
    };
    return { response: data.response, fetchCitations };
  };

  const fetchCitations = async (question, history = []) => {
    // Cache by question + history so multi-turn follow-ups aren't served stale
    // single-turn results.
    const cacheKey = question + "||" + history.join("|");
    if (cache[cacheKey]?.citations) {
      return cache[cacheKey].citations;
    }

    try {
      console.log("🔍 Making request to:", apiRoute("search"));
      const response = await fetch(apiRoute("search"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: question, history }),
      });

      console.log("🔍 Response status:", response.status);
      console.log("🔍 Response ok:", response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data_citations = await response.json();
      console.log("🔍 Response data:", data_citations);

      // Persist matched passages + best-answer quotes by discourse id so the blog
      // page can locate/highlight them even if router state is lost (refresh /
      // direct URL).
      try {
        const map = JSON.parse(
          sessionStorage.getItem("asv_matched_passages") || "{}"
        );
        const quoteMap = JSON.parse(
          sessionStorage.getItem("asv_best_sentences") || "{}"
        );
        (data_citations || []).forEach((c) => {
          if (c && c._id && c.matched_passage) map[c._id] = c.matched_passage;
          if (c && c._id && c.best_sentence) quoteMap[c._id] = c.best_sentence;
        });
        sessionStorage.setItem("asv_matched_passages", JSON.stringify(map));
        sessionStorage.setItem("asv_best_sentences", JSON.stringify(quoteMap));
      } catch (e) {
        /* sessionStorage unavailable — non-fatal */
      }

      cache[cacheKey] = { ...cache[cacheKey], citations: data_citations };
      return data_citations;
    } catch (error) {
      console.error("❌ Fetch error:", error);
      return []; // Return empty array instead of letting it fail
    }
  };

  // Fetch verified follow-up questions for an answer the user just received.
  // The backend regenerates+verifies follow-ups grounded in the citations we
  // already have, so we pass them along. Cached alongside citations by
  // question + history. Returns [] on any error (UI just shows no follow-ups).
  const fetchFollowups = async (question, history = [], citations = []) => {
    const cacheKey = question + "||" + history.join("|");
    if (cache[cacheKey]?.followups) {
      return cache[cacheKey].followups;
    }
    try {
      const response = await fetch(apiRoute("followups"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: question, history, results: citations }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const followups = Array.isArray(data?.followups) ? data.followups : [];
      cache[cacheKey] = { ...cache[cacheKey], followups };
      return followups;
    } catch (error) {
      console.error("❌ Follow-up fetch error:", error);
      return [];
    }
  };

  // Generate follow-up questions on demand for a specific message and patch them onto
  // that message's reply (and the persisted thread). Storing them inside
  // `reply.followUps` keeps them through the loadMessages reload + thread save.
  const handleGenerateFollowups = async (index) => {
    const target = messages[index];
    const citations = target?.reply?.citations || [];
    if (!target || citations.length === 0) return;

    // Recent prior questions in this thread → same multi-turn context handleSend uses.
    const history = messages
      .slice(0, index)
      .map((m) => m.question)
      .filter(Boolean)
      .slice(-3);

    setFollowupLoadingIndex(index);
    try {
      const followUps = await fetchFollowups(target.question, history, citations);
      if (!followUps || followUps.length === 0) return; // leave the button for a retry
      const withFollowups = messages.map((q, i) =>
        i === index ? { ...q, reply: { ...q.reply, followUps } } : q
      );
      setMessages(withFollowups);
      const existingThread = threads.find(
        (thread) => thread.id === selectedThreadId
      );
      if (existingThread) {
        addThread({ ...existingThread, messages: withFollowups });
      }
    } finally {
      setFollowupLoadingIndex(null);
    }
  };

  // Save message to backend if user is logged in
  // NOTE: This function is currently not used because messages are saved
  // via the addThread() function which calls saveChatThread() in the parent component.
  // Keeping this function for potential future use.
  const saveMessageToBackend = async (question, reply) => {
    if (!user || !user.token || !user.email || !selectedThreadId) return;

    try {
      const response = await fetch(apiRoute(`chats/${user.email}/${selectedThreadId}/messages`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          question: question,
          reply: reply
        })
      });

      if (!response.ok) {
        console.error("Failed to save message to backend:", response.statusText);
      }
    } catch (error) {
      console.error("Error saving message to backend:", error);
    }
  };

  const handleSend = async (question = null) => {
    const val = question || inputRef.current.value.trim();
    console.log('handleSend called with:', { question: val, user: !!user, selectedThreadId });
    if (val.length > 0) {
      setAskQuestion("");
      inputRef.current.value = "";
      console.log(setAskQuestion)

      const newIndex = messages.length;
      const updatedMessages = [...messages, { question: val, reply: null }];
      setMessages(updatedMessages);
      setLoadingIndex(newIndex); // Set loading index for the new question

      try {
        // Recent prior questions in this thread → multi-turn query planning context.
        const history = messages
          .map((m) => m.question)
          .filter(Boolean)
          .slice(-3);
        // Only fetch citations from /search endpoint
        const citations = await fetchCitations(val, history);

        // Update state with only citations
        const finalMessages = updatedMessages.map((q, index) =>
          index === newIndex
            ? {
              ...q,
              reply: {
                primaryResponse: "", // Empty since we don't want to display /query response
                citations,
              },
            }
            : q,
        );
        console.log('Setting messages with final messages:', finalMessages.length);
        setMessages(finalMessages);

        // Update the current thread with new messages
        // Note: We don't call saveMessageToBackend here because addThread will
        // save the entire thread (including this new message) to the backend via PUT
        const existingThread = threads.find(
          (thread) => thread.id === selectedThreadId,
        );

        // Only update title if this is the first message or if thread has no title
        const shouldUpdateTitle = !existingThread ||
          !existingThread.title ||
          existingThread.title === "New Chat" ||
          existingThread.title === "";

        // Generate title asynchronously if needed
        const threadTitle = shouldUpdateTitle
          ? await generateTitleFromQuestion(val)
          : (existingThread ? existingThread.title : "New Chat");

        const newThread = {
          id: selectedThreadId || new Date().toISOString(),
          title: threadTitle,
          timestamp: existingThread ? existingThread.timestamp : new Date(),
          messages: finalMessages,
        };

        addThread(newThread);
        // Ensure the just-created thread becomes the selected one, otherwise the
        // loadMessages effect (keyed on threads) re-fires with a stale/null
        // selectedThreadId and wipes the answer we just rendered.
        if (newThread.id !== selectedThreadId) {
          setSelectedThreadId(newThread.id);
        }
        // Follow-ups are now opt-in — the user generates them via a button on the
        // answer (handleGenerateFollowups), so nothing is fetched here.
        // navigate(`/thread/${newThread.id}`);
      } catch (error) {
        console.error("Error fetching data in handleSend:", error);
      } finally {
        setLoadingIndex(null); // Reset loading index
      }
    }
  };

  const handleKeyPress = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await handleSend();
    }
  };

  useEffect(() => {
    // Only scroll when a new message is added, not when an existing message is
    // patched in place (e.g. follow-ups generated on demand), which would yank
    // the user back to the top of the answer.
    const added = messages.length > prevMessageCount.current;
    prevMessageCount.current = messages.length;
    if (!added) return;

    const c = containerRef.current;
    if (!c) return;
    // Bring the latest question to the top so it and the first couple of
    // discourses stay in view (instead of jumping to the very bottom).
    const lastMsg = c.children[messages.length - 1];
    if (lastMsg) {
      const top =
        lastMsg.getBoundingClientRect().top -
        c.getBoundingClientRect().top +
        c.scrollTop;
      c.scrollTo({ top: Math.max(0, top - 12), behavior: "smooth" });
    } else {
      c.scrollTop = c.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (newChat) {
      setMessages([]);
      // navigate("/");
    }
  }, [newChat]);

  useEffect(() => {
    const loadMessages = async () => {
      if (selectedThreadId) {
        // First check if thread exists locally and has messages
        const selectedThread = threads.find(
          (thread) => thread.id === selectedThreadId,
        );

        if (selectedThread && selectedThread.messages && selectedThread.messages.length > 0) {
          // Use local messages if available
          setMessages(selectedThread.messages);
        } else if (user && user.token && user.email) {
          // Load messages from backend if user is logged in
          try {
            const backendMessages = await loadThreadMessages(selectedThreadId);
            setMessages(backendMessages);
          } catch (error) {
            console.error("Error loading messages from backend:", error);
            // Fallback to local messages or empty array
            setMessages(selectedThread?.messages || []);
          }
        } else {
          // Not logged in, use local messages or empty array
          setMessages(selectedThread?.messages || []);
        }
      } else {
        // No thread selected, clear messages
        setMessages([]);
      }
    };

    loadMessages();
  }, [selectedThreadId, threads, user]);

  const handleSampleQuestionClick = async (question) => {
    await handleSend(question);
  };

  const handleLinkClick = (question) => {
    const url = `${window.location.origin}/thread/${selectedThreadId}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const handleReloadClick = async (question) => {
    // Create a new message entry with the same question
    const newIndex = messages.length;
    const updatedMessages = [...messages, { question: question, reply: null }];
    setMessages(updatedMessages);
    setLoadingIndex(newIndex); // Set loading index for the new question

    try {
      // Clear the cache for this question to force a fresh response
      delete cache[question];

      // Only fetch citations from /search endpoint
      const citations = await fetchCitations(question);

      // Update state with only citations
      const finalMessages = updatedMessages.map((q, index) =>
        index === newIndex
          ? {
            ...q,
            reply: {
              primaryResponse: "", // Empty since we don't want to display /query response
              citations,
            },
          }
          : q
      );
      setMessages(finalMessages);

      // Update the thread
      const existingThread = threads.find(
        (thread) => thread.id === selectedThreadId
      );
      let reloadedThread = null;
      if (existingThread) {
        reloadedThread = {
          ...existingThread,
          messages: finalMessages,
        };
        addThread(reloadedThread);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingIndex(null); // Reset loading index
    }
  };

  const handleCopyClick = (text) => {
    navigator.clipboard.writeText(text);
    alert("Response text copied to clipboard!");
  };

  const SendIcon = askQuestion.length ? RiSendPlane2Fill : RiSendPlane2Line;

  return (
    <div className="w-full flex flex-col h-[100vh] mt-16 bg-white">
      <div className="flex-1 flex flex-col relative min-h-0 isolate">
        <DecorativeBackground />
        {messages.length > 0 ? (
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto flex flex-col no-scrollbar mx-4 p-3 md:p-4 w-full max-w-4xl mx-auto mb-16">
            {messages.map((msg, index) => (
              <Reply
                key={index}
                question={msg.question}
                reply={msg.reply}
                loading={loadingIndex === index}
                onLinkClick={handleLinkClick}
                onReloadClick={handleReloadClick}
                onCopyClick={handleCopyClick}
                onSaveDiscourse={onSaveDiscourse}
                onUnsaveDiscourse={onUnsaveDiscourse}
                savedDiscourses={savedDiscourses}
                user={user}
                followUps={msg.reply?.followUps || []}
                onFollowUpClick={(q) => handleSend(q)}
                onGenerateFollowups={() => handleGenerateFollowups(index)}
                followUpsLoading={followupLoadingIndex === index}
              />
            ))}
            {/* Spacer so the last reply / loading indicator clears the sticky
                search bar (padding-bottom on a flex scroll container is ignored
                for scroll space in Chrome/Safari). */}
            <div aria-hidden="true" className="shrink-0 h-48" />
          </div>
        ) : (
          <div className="flex-grow overflow-y-scroll flex justify-center items-center">
            <div className="flex flex-col w-full max-w-2xl items-center justify-center gap-4 px-4">
              <p className="p-2 text-gray-800 text-justify min-w-[350px] text-xl">
                Ask a question to&nbsp;<b>Sai Vidya</b> and get discourses that you can explore.
              </p>
              <div>
                <SampleQuestions onQuestionClick={handleSampleQuestionClick} />
              </div>
            </div>
          </div>
        )}

        <div className="sticky bottom-4 mx-4 md:mx-auto w-full max-w-4xl mx-auto bg-white p-4">
          <div className="flex justify-center items-center border border-[#C2C2C2] gap-2 rounded h-[84px] p-4 bg-white">
            <textarea
              ref={inputRef}
              className="flex-grow rounded pt-3 resize-none outline-none text-xl min-h-[72px] bg-transparent text-gray-800 placeholder:text-gray-800"
              id="textBox"
              cols="10"
              rows="2"
              placeholder="Ask a question"
              onKeyDown={handleKeyPress}
            />
            <div className="text-gray-300 p-2">
              <SendIcon
                className="cursor-pointer hover:shadow-lg"
                onClick={() => handleSend()}
                size={24}
                color="#BC5B01"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
