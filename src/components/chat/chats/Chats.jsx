import React, { useState } from "react";
import { BsChatLeftDots } from "react-icons/bs";
import { IoEllipsisVertical, IoTrashOutline } from "react-icons/io5";

export default function Chats({
	id = "12345",
	title = "What is the question?",
	quesNumbers = "0",
	date = "12/12/2021",
	onChatSelect = () => {},
	onDeleteChat = () => {},
}) {
	const [showMenu, setShowMenu] = useState(false);
	const [showConfirmation, setShowConfirmation] = useState(false);

	// Use first message question as title if title is empty
	const displayTitle = title && title.trim() !== "" ? title : "New Chat";
	const messageCount = quesNumbers || 0;

	const handleMenuToggle = (e) => {
		e.stopPropagation();
		setShowMenu(!showMenu);
	};

	const handleDeleteClick = (e) => {
		e.stopPropagation();
		setShowMenu(false);
		setShowConfirmation(true);
	};

	const handleConfirmDelete = () => {
		onDeleteChat(id);
		setShowConfirmation(false);
	};

	const handleCancelDelete = () => {
		setShowConfirmation(false);
	};

	const handleClickOutside = () => {
		setShowMenu(false);
	};

	// Add event listener to close menu when clicking outside
	React.useEffect(() => {
		if (showMenu) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	}, [showMenu]);

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
					
					{/* Three dots menu */}
					<div className="relative">
						<button
							onClick={handleMenuToggle}
							className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
						>
							<IoEllipsisVertical size={16} className="text-gray-500" />
						</button>
						
						{/* Dropdown Menu */}
						{showMenu && (
							<div
								className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[120px]"
								onClick={(e) => e.stopPropagation()}
							>
								<button
									onClick={handleDeleteClick}
									className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm"
								>
									<IoTrashOutline size={16} />
									Delete Chat
								</button>
							</div>
						)}
					</div>
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
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
						<h3 className="text-lg font-semibold mb-4">Delete Chat</h3>
						<p className="text-gray-600 mb-6">
							Are you sure you want to delete "{displayTitle}"? This action cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<button
								onClick={handleCancelDelete}
								className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmDelete}
								className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
