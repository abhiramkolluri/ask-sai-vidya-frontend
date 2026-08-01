import React from "react";

// `compact` is the home page's new-thread layout: the cards sit directly under
// a centred search bar, so they go smaller and two-across instead of one tall
// stack. It is opt-in rather than the new default because FollowUpQuestions
// deliberately mirrors the default styling — changing it here would shift the
// follow-up cards under every answer too.
export default function SampleQuestions({ onQuestionClick = () => {}, compact = false }) {
  const sampleQuestions = [
    "Help me find some discourses to learn more about the value of Truth",
    "What does Swami say about stopping bad habits and learning good ones?",
    "My goal is to be more mindful in my daily life. Find discourses that can inspire me.",
    "I want to learn more about the importance of compassion through reading discourses.",
  ];

  if (compact) {
    return (
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-gray-700 cursor-pointer">
        {sampleQuestions.map((question, index) => (
          <div
            key={index}
            className="border border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-100 flex items-center justify-center px-3 py-2 min-h-[3rem] transition-all ease-linear text-center text-xs sm:text-sm leading-snug"
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-wrap gap-4 text-gray-800 text-lg leading-6 cursor-pointer justify-center items-center">
      {sampleQuestions.map((question, index) => (
        <div
          key={index}
          className="border border-gray-300 rounded hover:border-orange-500 hover:bg-orange-100 flex items-center justify-center px-4 py-3 sm:py-2 w-full max-w-[346px] min-h-[4rem] sm:h-16 transition-all ease-linear text-center text-base sm:text-lg leading-snug"
          onClick={() => onQuestionClick(question)}
        >
          {question}
        </div>
      ))}
    </div>
  );
}
