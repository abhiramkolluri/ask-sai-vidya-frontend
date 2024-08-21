import React from "react";

export default function SampleQuestions({ onQuestionClick = () => {} }) {
	const sampleQuestions = [
		"How do you find life’s purpose?",
		"In this ever changing world, how do I encourage my child to follow Sai Baba's values?",
		"What does Sai Baba say about stopping bad habits and learning new habits?",
		"How do I sing Bhajans, do service, learn prayers, meditate, and do yoga?",
	];

	return (
		<div className="w-full flex flex-wrap gap-4 text-gray-500 text-lg leading-6 cursor-pointer justify-center items-center">
			{sampleQuestions.map((question, index) => (
				<div
					key={index}
					className="border border-gray-300 rounded hover:border-orange-500 hover:bg-orange-100 flex items-center justify-center px-4 py-2 w-[346px] h-16 transition-all ease-linear text-center"
					onClick={() => onQuestionClick(question)}
				>
					{question}
				</div>
			))}
		</div>
	);
}
