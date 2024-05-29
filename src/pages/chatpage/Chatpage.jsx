import React, { useState, useEffect } from "react";
import SideNav from "../../components/sidenav/SideNav";
import ChatBox from "../../components/chatbox/ChatBox";
import Login from "../../components/login/Login";
import Signup from "../../components/signup/Signup";
import Navbar from "../../components/navbar/navbar";

const Chatpage = () => {
	const [newChat, setNewChat] = useState(Math.random());
	const [showModal, setShowModal] = useState(false);
	const [showLogin, setShowLogin] = useState(false);
	const [selectedThreadId, setSelectedThreadId] = useState(null);
	const [threads, setThreads] = useState([]);

	const handleShowModal = () => {
		setShowModal(true);
	};

	const handleNewChat = () => {
		const newThreadId = new Date().toISOString();
		setNewChat(Math.random());
		setSelectedThreadId(newThreadId);
		addThread({
			id: newThreadId,
			title: "",
			timestamp: new Date(),
			messages: [],
		});
	};

	const handleChatSelect = (threadId) => {
		setSelectedThreadId(threadId);
	};

	const addThread = (thread) => {
		setThreads((prevThreads) => {
			const existingThread = prevThreads.find((t) => t.id === thread.id);
			if (existingThread) {
				return prevThreads.map((t) =>
					t.id === thread.id ? { ...t, ...thread } : t
				);
			} else {
				return [thread, ...prevThreads];
			}
		});
	};

	useEffect(() => {
		if (threads.length === 0) {
			handleNewChat();
		}
	}, [threads]);

	return (
		<div className="w-full h-[100vh] flex overflow-hidden">
			<div className="w-[300px] bg-white shadow-lg flex-col overflow-hidden hidden md:block md:flex flex-shrink-0">
				<SideNav
					startNewChatCallback={handleNewChat}
					onChatSelect={handleChatSelect}
					threads={threads}
				/>
			</div>
			<div className="absolute top-0 left-0 right-0">
				<Navbar />
			</div>
			<div className="flex flex-col flex-grow mt-16">
				<ChatBox
					newChat={newChat}
					modalCallback={handleShowModal}
					selectedThreadId={selectedThreadId}
					addThread={addThread}
					threads={threads}
				/>
			</div>
			{showModal && (
				<div
					className="absolute top-0 bottom-0 right-0 left-0 flex justify-center items-center bg-black bg-opacity-20 z-50"
					onClick={handleShowModal}
				>
					{showLogin ? (
						<Login callback={() => setShowLogin(false)} />
					) : (
						<Signup callback={() => setShowLogin(true)} />
					)}
				</div>
			)}
		</div>
	);
};

export default Chatpage;
