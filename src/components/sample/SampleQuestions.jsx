import React from "react";

export default function SampleQuestions({ onQuestionClick = () => {} }) {
	const sampleQuestions = [
		"When did Sai Baba say the best time to wake up?",
		"When is the good time to go for walk?",
		"What is the definition?",
		"When is the good time to wake up?",
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
