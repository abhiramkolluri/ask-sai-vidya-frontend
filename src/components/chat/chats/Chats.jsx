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
				className={`w-full p-2 flex flex-col text-sm gap-2 transition-all ease-in-out cursor-pointer border border-transparent rounded hover:bg-orange-50 hover:border-orange-400 relative group`}
				onClick={() => onChatSelect(id)}
			>
				<div className={`flex gap-2 text-gray-600 items-center justify-between`}>
					<div className="flex gap-2 items-center flex-1 min-w-0">
						<span className="text-orange-400">
							<BsChatLeftDots size={16} />
						</span>
						<p className="truncate" title={displayTitle}>{displayTitle}</p>
					</div>

					{/* Trash icon - similar to saved discourses */}
					<button
						onClick={handleDeleteClick}
						className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
						title="Delete chat"
					>
						<BsTrash size={14} className="text-red-600" />
					</button>
				</div>

				<div className="flex text-xs text-gray-400 font-thin">
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
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
					<div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 animate-fadeIn">
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
