import React from "react";

// Clickable follow-up question chips shown under an answer's citations. Each
// chip, when clicked, submits its text as a new query (via onQuestionClick).
// Styling mirrors SampleQuestions so the two question-suggestion surfaces match.
export default function FollowUpQuestions({ questions = [], onQuestionClick = () => {} }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="w-full">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Continue exploring
      </p>
      <div className="flex flex-wrap gap-2.5">
        {questions.map((question, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onQuestionClick(question)}
            className="border border-orange-200/80 bg-white rounded-lg hover:border-orange-500 hover:bg-orange-50 px-4 py-2.5 text-left text-sm text-gray-800 leading-snug transition-all ease-linear cursor-pointer max-w-full"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
