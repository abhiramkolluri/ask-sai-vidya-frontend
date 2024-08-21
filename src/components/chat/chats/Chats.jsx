import React from "react";
import { BsChatLeftDots } from "react-icons/bs";

export default function Chats({
	id = "12345",
	title = "What is the question?",
	quesNumbers = "0",
	date = "12/12/2021",
	onChatSelect = () => {},
}) {
	return (
		<div
			className={`w-full p-2 flex flex-col text-sm gap-2 transition-all ease-in-out cursor-pointer border border-transparent rounded hover:bg-orange-50 hover:border-orange-400`}
			onClick={() => onChatSelect(id)}
		>
			<div className={`flex gap-2 text-gray-600 items-center`}>
				<span className="text-orange-400">
					<BsChatLeftDots size={16} />
				</span>
				<p className="truncate w-50">{title}</p>
			</div>
			<div className="flex text-xs text-gray-400 font-thin">
				<div className="flex-grow">
					<p>{quesNumbers + " "} Questions</p>
				</div>
				<div>
					<p>
						{new Date(date).getDate() +
							" " +
							new Date(date).toLocaleString("en-US", { month: "short" })}
					</p>
				</div>
			</div>
		</div>
	);
}
