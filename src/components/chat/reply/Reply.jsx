import React from "react";
import { BsPersonVideo } from "react-icons/bs";
import { RiDoubleQuotesL } from "react-icons/ri";
import { IoLinkOutline, IoReload, IoCopyOutline } from "react-icons/io5";
import { GoArrowUpRight } from "react-icons/go";
import { FaSpinner } from "react-icons/fa";

export default function Reply({
	question = "What the user asked?",
	reply,
	loading,
}) {
	console.log("Reply component received reply:", reply);

	if (loading) {
		return (
			<div className="w-full text-gray-500 text-sm">
				<div className="flex items-center gap-2">
					<span className="text-orange-400">
						<BsPersonVideo size={24} />
					</span>
					<span className="text-base">{question}</span>
				</div>
				<div className="flex animate-spin items-center justify-center w-24 h-24 mx-auto mt-12 text-orange-400">
					<FaSpinner size={24} />
				</div>
			</div>
		);
	}

	if (!reply) {
		return (
			<div className="w-full text-gray-500 text-sm">
				<div className="flex items-center gap-2">
					<span className="text-orange-400">
						<BsPersonVideo size={24} />
					</span>
					<span className="text-base">{question}</span>
				</div>
			</div>
		);
	}

	const { primaryResponse = "", citations = [] } = reply;

	return (
		<div className="w-full text-gray-500 text-sm">
			<div className="flex items-center gap-2">
				<span className="text-orange-400">
					<BsPersonVideo size={24} />
				</span>
				<span className="text-base">{question}</span>
			</div>
			<div className="p-2 md:p-6">
				<div className="border-l border-orange-400 p-2 px-4 flex flex-col">
					<span className="text-orange-400">
						<RiDoubleQuotesL size={24} />
					</span>
					<div className="px-4 flex items-end font-thin gap-1">
						<div className="flex-flex-col gap-2 flex-grow">
							<div className=" ">
								<h2 className="font-bold my-2 text-gray-600 text-base">
									Response
								</h2>
								<p className="text-base">{primaryResponse}</p>
							</div>
						</div>
						<div className="border-l border-orange-400 flex-shrink-0 py-2 px-2 flex flex-col gap-4 text-orange-400">
							<IoLinkOutline size={20} className="cursor-pointer" />
							<IoReload size={18} className="cursor-pointer" />
							<IoCopyOutline size={18} className="cursor-pointer" />
						</div>
					</div>
				</div>
				<div className="p-2 flex flex-col">
					<div className="px-4 flex font-thin gap-1">
						<div className="flex-flex-col gap-2 bg-orange-50 rounded p-2 flex-grow">
							<h2 className="flex gap-2 my-2 text-gray-600 font-semibold text-base">
								Citations
							</h2>
							{citations.length > 0 ? (
								citations.map((item, index) => (
									<div key={index} className="text-gray-700">
										<h3 className="font-bold">{item.title}</h3>
										<p className="italic">{item.collection}</p>
										<p className="italic">{item.date}</p>
										<p className="border-l-2 border-dotted p-2 ml-3 border-orange-400 text-base">
											{item.content.length > 200
												? item.content.slice(0, 200) + "..."
												: item.content}{" "}
											<a
												className="text-orange-400 flex items-center gap-1"
												href="http://somewebsite.com"
											>
												see more <GoArrowUpRight size={20} />
											</a>
										</p>
									</div>
								))
							) : (
								<p>No citations found.</p>
							)}
						</div>
						<div className="flex-grow w-20"></div>
					</div>
				</div>
			</div>
		</div>
	);
}
