import React, { useState } from "react";
import { BsChatLeftDots, BsTrash } from "react-icons/bs";

export default function Chats({
	id = "12345",
	title = "What is the question?",
	quesNumbers = "0",
	date = "12/12/2021",
	onChatSelect = () => { },
	onDeleteChat = () => { },
}) {
	const [showConfirmation, setShowConfirmation] = useState(false);

	// Use first message question as title if title is empty
	const displayTitle = title && title.trim() !== "" ? title : "New Chat";
	const messageCount = quesNumbers || 0;

	const handleDeleteClick = (e) => {
		e.stopPropagation();
		setShowConfirmation(true);
	};

	const handleConfirmDelete = () => {
		onDeleteChat(id);
		setShowConfirmation(false);
	};

	const handleCancelDelete = () => {
		setShowConfirmation(false);
	};

	return (
		<>
			<div
				className="w-full p-3 flex flex-col gap-1.5 transition-all ease-in-out cursor-pointer border border-transparent rounded-xl hover:bg-orange-50/70 hover:border-orange-200/50 relative group"
				onClick={() => onChatSelect(id)}
			>
				<div className="flex gap-2 text-gray-900 text-[15px] font-medium items-center justify-between">
					<div className="flex gap-2.5 items-center flex-1 min-w-0">
						<span className="text-orange-400 shrink-0">
							<BsChatLeftDots size={15} />
						</span>
						<p className="truncate leading-snug" title={displayTitle}>{displayTitle}</p>
					</div>

					<button
						onClick={handleDeleteClick}
						className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg"
						title="Delete chat"
					>
						<BsTrash size={14} className="text-red-500" />
					</button>
				</div>

				<div className="flex text-[13px] text-gray-400 pl-[26px]">
					<div className="flex-grow">
						<p>{messageCount + " "} Questions</p>
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

			{/* Confirmation Modal */}
			{showConfirmation && (
				<div
					className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4"
					onClick={handleCancelDelete}
				>
					<div
						className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-fadeIn"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-6">
							<h3 className="text-lg font-bold text-gray-900 mb-3">
								Delete Chat?
							</h3>
							<p className="text-gray-600 mb-6">
								Are you sure you want to delete "{displayTitle}"? This action cannot be undone.
							</p>
							<div className="flex gap-3 justify-end">
								<button
									onClick={handleCancelDelete}
									className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium"
								>
									Cancel
								</button>
								<button
									onClick={handleConfirmDelete}
									className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
