import React, { useState } from "react";
import { IoMdArrowDown } from "react-icons/io";
import Chats from "../chats/Chats";

export default function ChatSection({
	monthYear = "",
	threads = [],
	onChatSelect = () => {},
}) {
	const [showChats, setShowChats] = useState(true);

	const formatMonthYear = (key) => {
		const [month, year] = key.split("-");
		return `${new Date(year, month - 1).toLocaleString("en-us", {
			month: "long",
		})} ${year}`;
	};

	return (
		<div className="">
			<div className="flex text-gray-400 my-4 justify-center items-center">
				<div className="flex-grow">{formatMonthYear(monthYear)}</div>
				<div
					className="cursor-pointer hover:text-orange-400"
					onClick={() => setShowChats(!showChats)}
				>
					<IoMdArrowDown size={20} />
				</div>
			</div>
			{showChats && (
				<div className="flex flex-col gap-2">
					{threads.map((thread, index) => (
						<Chats
							key={index}
							id={thread.id}
							title={thread.title}
							quesNumbers={thread.messages.length}
							date={new Date(thread.timestamp)}
							onChatSelect={onChatSelect}
						/>
					))}
				</div>
			)}
		</div>
	);
}
