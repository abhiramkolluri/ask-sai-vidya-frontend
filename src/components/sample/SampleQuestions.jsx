import React from "react";

export default function SampleQuestions({ onQuestionClick = () => {} }) {
  const sampleQuestions = [
    "Help me find some discourses to learn more about the value of Truth",
    "What does Swami say about stopping bad habits and learning good ones?",
    "My goal is to be more mindful in my daily life. Find discourses that can inspire me.",
    "I want to learn more about the importance of compassion through reading discourses.",
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
