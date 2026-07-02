import React, { useState, useEffect, useRef } from "react";
import SideNav from "../../components/sidenav/SideNav";
import ChatBox from "../../components/chatbox/ChatBox";
import BrowseTab from "../../components/browse/BrowseTab";
import HowToTab from "../../components/howto/HowToTab";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { useSavedDiscourses } from "../../contexts/SavedDiscoursesContext";
import { apiRoute } from "../../helpers/apiRoute";
// import Feedback from "../../components/feedback/Feedback";

const Chatpage = () => {
  const [newChat, setNewChat] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "browse"
  const initialChatCreatedRef = useRef(false);
  const { user } = useAuth();

  // Use saved discourses from context
  const {
    savedDiscourses,
    saveDiscourse,
    removeBookmark,
    loadSavedDiscourses
  } = useSavedDiscourses();

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Reload saved discourses when component mounts or comes into view
  useEffect(() => {
    if (user && user.token) {
      loadSavedDiscourses();
    }
  }, [user, loadSavedDiscourses]);

  // Save a discourse - now using context
  const handleSaveDiscourse = async (discourseData, questionContext) => {
    await saveDiscourse(discourseData, questionContext);
  };

  // Unsave a discourse - now using context  
  const handleUnsaveDiscourse = async (discourseId) => {
    await removeBookmark(discourseId);
  };

  // Load user's chat threads from backend
  const loadUserChats = async () => {
    if (!user || !user.token) return;

    try {
      setLoading(true);
      const response = await fetch(apiRoute(`chats/${user.email}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const chatThreads = await response.json();
        setThreads(chatThreads);

        // If user has existing chats, select the most recent one. Otherwise
        // create and select an empty chat so there is always a valid
        // selectedThreadId before the user's first question (prevents the
        // loadMessages effect from wiping the first answer).
        if (chatThreads.length > 0) {
          setThreads(chatThreads);
          setSelectedThreadId(chatThreads[0].id);
        } else {
          const newThread = await createNewChatThread();
          setSelectedThreadId(newThread.id);
          addThread(newThread);
        }
      } else {
        console.error("Failed to load chats:", response.statusText);
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadThreadMessages = async (threadId) => {
    if (!user || !user.token || !threadId) return [];

    try {
      const response = await fetch(apiRoute(`chats/${threadId}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const thread = await response.json();
        return thread.messages || [];
      }
    } catch (error) {
      console.error("Error loading thread messages:", error);
    }

    return [];
  };

  const ensureActiveThread = async () => {
    if (selectedThreadId) {
      const existing = threads.find((t) => t.id === selectedThreadId);
      if (existing) return existing;
    }

    const emptyChat = threads.find(
      (thread) => !thread.messages || thread.messages.length === 0
    );
    if (emptyChat) {
      setSelectedThreadId(emptyChat.id);
      return emptyChat;
    }

    const newThread = await createNewChatThread();
    setSelectedThreadId(newThread.id);
    setThreads((prev) => [newThread, ...prev]);
    return newThread;
  };

  // Create a new chat thread in backend
  const createNewChatThread = async (title = "New Chat") => {
    if (!user || !user.token) {
      const newThreadId = new Date().toISOString();
      return {
        id: newThreadId,
        title: title,
        timestamp: new Date(),
        messages: [],
      };
    }

    try {
      const requestBody = { title: title };

      if (user.email) {
        requestBody.user_email = user.email;
      }

      const response = await fetch(apiRoute(`chats/${user.email}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const newThread = await response.json();
        return newThread;
      }

      console.error("Failed to create chat thread:", response.statusText);
      const newThreadId = new Date().toISOString();
      return {
        id: newThreadId,
        title: title,
        timestamp: new Date(),
        messages: [],
      };
    } catch (error) {
      console.error("Error creating chat thread:", error);
      const newThreadId = new Date().toISOString();
      return {
        id: newThreadId,
        title: title,
        timestamp: new Date(),
        messages: [],
      };
    }
  };

  // Load user chats when user logs in or out
  useEffect(() => {
    if (user && user.token) {
      loadUserChats();
    } else {
      setThreads([]);
      setSelectedThreadId(null);
    }
  }, [user]);

  // Create initial chat if no threads exist and user is not logged in
  useEffect(() => {
    if (threads.length === 0 && !user && !initialChatCreatedRef.current) {
      const createInitialChat = async () => {
        initialChatCreatedRef.current = true;
        const newThread = await createNewChatThread();
        setSelectedThreadId(newThread.id);
        addThread(newThread);
      };
      createInitialChat();
    }
  }, [threads.length, user]);

  // Save chat thread to backend
  const saveChatThread = async (thread) => {
    if (!user || !user.token) return;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(thread.id);
    if (!isUuid) {
      console.error("Cannot save chat thread: invalid thread id", thread.id);
      return;
    }

    try {
      const response = await fetch(apiRoute(`chats/${thread.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          title: thread.title,
          messages: thread.messages,
          user_email: user.email
        })
      });

      if (!response.ok) {
        console.error("Failed to save chat thread:", response.statusText);
      }
    } catch (error) {
      console.error("Error saving chat thread:", error);
    }
  };

  // Delete chat thread from backend
  const deleteChatThread = async (threadId) => {
    if (!user || !user.token) return; // Don't delete if not logged in

    try {
      const response = await fetch(apiRoute(`chats/${threadId}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          user_email: user.email
        })
      });

      if (!response.ok) {
        console.error("Failed to delete chat thread:", response.statusText);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error deleting chat thread:", error);
      return false;
    }
  };

  // Handle chat deletion
  const handleDeleteChat = async (threadId) => {
    // Remove from local state immediately for better UX
    setThreads((prevThreads) => prevThreads.filter((thread) => thread.id !== threadId));

    // If this was the selected thread, clear selection
    if (selectedThreadId === threadId) {
      setSelectedThreadId(null);
    }

    // Delete from backend if user is logged in
    if (user && user.token) {
      const success = await deleteChatThread(threadId);
      if (!success) {
        // If backend deletion failed, reload threads to restore the deleted one
        loadUserChats();
      }
    }
  };

/*
  // Generate AI summary for chat title from the first question (Disabled for now - using simple truncation instead)
  const generateAITitleFromQuestion = async (question) => {
    if (!question) return "New Chat";

    try {
      const response = await fetch(apiRoute("summarize-question"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: question })
      });

      if (response.ok) {
        const data = await response.json();
        return data.summary;
      } else {
        console.error("Failed to generate AI title:", response.statusText);
        return "AI Generated Title"; // Placeholder - replace with actual backend call
      }
    } catch (error) {
      console.error("Error generating AI title:", error);
      // Fallback to simple truncation if AI generation fails
      const cleanQuestion = question.trim();
      if (cleanQuestion.length <= 50) {
        return cleanQuestion;
      }
      return cleanQuestion.substring(0, 50) + "...";
    }
  };
*/

  const getTitleFromQuestion = (question) => {
    if (!question) return "New Chat";
    const clean = question.trim();
    return clean.length <= 50 ? clean : clean.substring(0, 50) + "...";
  };

  const handleNewChat = async () => {
    // Check if there's already an empty chat
    const emptyChat = threads.find(thread => !thread.messages || thread.messages.length === 0);

    if (emptyChat) {
      // If there's an empty chat, just select it
      setSelectedThreadId(emptyChat.id);
      setNewChat(Math.random()); // Trigger new chat in ChatBox
    } else {
      // If no empty chat exists, create a new one
      const newThread = await createNewChatThread();
      setSelectedThreadId(newThread.id);
      addThread(newThread);
      setNewChat(Math.random()); // Trigger new chat in ChatBox
    }
    initialChatCreatedRef.current = true; // Set flag to prevent automatic creation
  };

  // Check if a chat is empty (no messages)
  const isChatEmpty = (threadId) => {
    const thread = threads.find(t => t.id === threadId);
    return !thread || !thread.messages || thread.messages.length === 0;
  };

  // Delete empty chat
  const deleteEmptyChat = async (threadId) => {
    if (isChatEmpty(threadId)) {
      await handleDeleteChat(threadId);
    }
  };

  const handleChatSelect = async (threadId) => {
    // If we're switching away from a chat and it's empty, delete it
    if (selectedThreadId && selectedThreadId !== threadId) {
      await deleteEmptyChat(selectedThreadId);
    }
    setSelectedThreadId(threadId);
  };

  const addThread = (thread) => {
    setThreads((prevThreads) => {
      const existingThread = prevThreads.find((t) => t.id === thread.id);
      if (existingThread) {
        const updatedThreads = prevThreads.map((t) =>
          t.id === thread.id ? { ...t, ...thread } : t,
        );
        // Save to backend if user is logged in
        if (user && user.token) {
          saveChatThread(thread);
        }
        return updatedThreads;
      } else {
        const newThreads = [thread, ...prevThreads];
        // Save to backend if user is logged in
        if (user && user.token) {
          saveChatThread(thread);
        }
        return newThreads;
      }
    });
  };

  // Cleanup empty chats when leaving the page
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (selectedThreadId && isChatEmpty(selectedThreadId)) {
        await deleteEmptyChat(selectedThreadId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedThreadId]);

  return (
    <div className="w-full h-[100vh] flex overflow-hidden bg-white">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg flex-col overflow-hidden transition-all duration-300 ${sidebarVisible ? 'w-[340px] border-r-2 border-primary/40' : 'w-0'
        } hidden md:flex`}>
        <SideNav
          startNewChatCallback={handleNewChat}
          onChatSelect={handleChatSelect}
          onDeleteChat={handleDeleteChat}
          threads={threads}
          loading={loading}
        />
      </div>

      {/* Main Content */}
      <div className={`flex flex-col flex-grow mt-2 relative transition-all duration-300 ${sidebarVisible ? 'ml-0' : 'ml-0'
        }`}>
        {/* Hamburger Button */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Header: tabs + account/login on one themed bar */}
        <div className="absolute top-0 left-0 right-0 z-30">
          <Navbar
            tabs={
              <div className="flex items-center gap-1 rounded-lg bg-white/90 p-1 shadow-md backdrop-blur-sm">
                {[
                  { key: "chat", label: "Questions" },
                  { key: "browse", label: "Saved Discourses" },
                  { key: "howto", label: "How to Use" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                      ? "bg-[#BC5B01] text-white shadow-sm"
                      : "text-gray-600 hover:bg-orange-50 hover:text-[#BC5B01]"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            }
          />
        </div>

        {/* Main view */}
        {activeTab === "chat" && (
          <ChatBox
            newChat={newChat}
            selectedThreadId={selectedThreadId}
            setSelectedThreadId={setSelectedThreadId}
            addThread={addThread}
            threads={threads}
            user={user}
            generateTitleFromQuestion={getTitleFromQuestion} // Using simple truncation for now not AI generation
            savedDiscourses={savedDiscourses}
            onSaveDiscourse={handleSaveDiscourse}
            onUnsaveDiscourse={handleUnsaveDiscourse}
          />
        )}
        {activeTab === "browse" && (
          <div className="flex-grow overflow-hidden pt-16">
            <BrowseTab />
          </div>
        )}
        {activeTab === "howto" && (
          <div className="flex-grow overflow-hidden pt-16">
            <HowToTab />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatpage;