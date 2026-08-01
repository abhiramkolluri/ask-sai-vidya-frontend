import React, { useState } from "react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import Chats from "../chats/Chats";

export default function ChatSection({
	monthYear = "",
	threads = [],
	onChatSelect = () => {},
	onDeleteChat = () => {},
}) {
	const [showChats, setShowChats] = useState(true);
	const [downArrow, setDownArrow] = useState(true);

	const formatMonthYear = (key) => {
		const [month, year] = key.split("-");
		return `${new Date(year, month - 1).toLocaleString("en-us", {
			month: "long",
		})} ${year}`;
	};

	return (
		<div className="mb-1">
			<div className="flex text-[13px] font-semibold tracking-wide text-gray-400 uppercase my-2.5 px-2 justify-center items-center">
				<div className="flex-grow">{formatMonthYear(monthYear)}</div>
				<button
					type="button"
					className="cursor-pointer hover:text-orange-400 transition-colors p-0.5"
					onClick={() => {
						setShowChats(!showChats);
						setDownArrow(!downArrow);
					}}
					aria-label={downArrow ? "Collapse month" : "Expand month"}
				>
					{downArrow ? (
						<IoMdArrowDown size={18} />
					) : (
						<IoMdArrowUp size={18} />
					)}
				</button>
			</div>
			{showChats && (
				<div className="flex flex-col gap-1">
					{threads.map((thread, index) => (
						<Chats
							key={index}
							id={thread.id}
							title={thread.title}
							quesNumbers={thread.messages ? thread.messages.length : 0}
							date={new Date(thread.timestamp)}
							onChatSelect={onChatSelect}
							onDeleteChat={onDeleteChat}
						/>
					))}
				</div>
			)}
		</div>
	);
}
