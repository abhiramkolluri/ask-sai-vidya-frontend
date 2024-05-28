import React, { useEffect, useState } from "react";
import Logo from "../logo/Logo";
import { IoMdSearch } from "react-icons/io";
import ChatSection from "../chat/chatSection/ChatSection";
import { LuPencilLine } from "react-icons/lu";

export default function SideNav({
	threads = [],
	startNewChatCallback = () => {},
	onChatSelect = () => {},
}) {
	const [sectionData, setSectionData] = useState({});

	useEffect(() => {
		const groupedThreads = threads.reduce((acc, thread) => {
			const date = new Date(thread.timestamp);
			const key = `${date.getMonth() + 1}-${date.getFullYear()}`;

			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(thread);

			return acc;
		}, {});
		// Sort threads within each section by timestamp in descending order
		for (const key in groupedThreads) {
			groupedThreads[key].sort(
				(a, b) => new Date(b.timestamp) - new Date(a.timestamp)
			);
		}

		// Sort sections by timestamp in descending order
		const sortedSectionData = Object.keys(groupedThreads)
			.sort((a, b) => {
				const [aMonth, aYear] = a.split("-");
				const [bMonth, bYear] = b.split("-");
				const aDate = new Date(aYear, aMonth - 1);
				const bDate = new Date(bYear, bMonth - 1);
				return bDate - aDate;
			})
			.reduce((acc, key) => {
				acc[key] = groupedThreads[key];
				return acc;
			}, {});

		setSectionData(sortedSectionData);
	}, [threads]);

	return (
		<div className=" w-full flex flex-col gap-2 p-4 text-sm h-[100vh] z-50">
			<div>
				<Logo />
			</div>
			<div className="border-b border-orange-400 flex gap-2 justify-center items-center ">
				<div className=" ml-2 text-orange-400">
					<IoMdSearch size={20} />
				</div>
				<input
					type="text"
					placeholder="Search"
					className="w-full p-2 outline-none -ml-2 "
				/>
			</div>
			<div className="mt-4 flex flex-col gap-2 flex-grow overflow-y-scroll no-scrollbar">
				{Object.keys(sectionData).map((key) => (
					<ChatSection
						key={key}
						monthYear={key}
						threads={sectionData[key]}
						onChatSelect={onChatSelect}
					/>
				))}
			</div>

			<div>
				<div
					onClick={() => startNewChatCallback()}
					className=" bg-orange-400 text-white flex items-center w-full py-4 px-2 rounded cursor-pointer"
				>
					<LuPencilLine size={20} />
					<p className="ml-2 text-base">New Question</p>
				</div>
			</div>
		</div>
	);
}
