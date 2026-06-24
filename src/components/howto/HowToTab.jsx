import React from "react";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { BsListOl, BsBookmarkStarFill } from "react-icons/bs";
import { PiPlantLight } from "react-icons/pi";
import DecorativeBackground from "../common/DecorativeBackground";
import swami from "../../assets/illustrations/swami.svg";

// ─── Editable "dialogue" content ────────────────────────────────────────────────
// Replace the title/body text below with your own dialogues. Each entry renders
// as one card in the right-hand column.
const STEPS = [
  {
    Icon: IoChatbubbleEllipsesOutline,
    title: "Ask a question",
    body: "Ask a question about a topic you would like to learn more about from a spiritual perspective. The search results will contain discourses that could answer your question.",
  },
  {
    Icon: BsListOl,
    title: "Choose a discourse",
    body: "Discourses are shown in order of potential relevance to the question. Click on a discourse to be taken to the paragraph that best answers your question.",
  },
  {
    Icon: BsBookmarkStarFill,
    title: "Study the discourse",
    body: "Read the discourse carefully, and think deeply about its meaning. Use the highlighting feature to save quotes, and add annotations that allow you to save your thoughts. Did the discourse answer your question?",
  },
  {
    Icon: PiPlantLight,
    title: "Build a Sadhana",
    body: "Over time, you will build a personal library of Swami's literature in the \"Saved Discourses\" tab. The more discourses you read, the deeper your understanding of Swami's mission will become. These discourses are just the beginning - their real value comes from applying the lessons found within.",
  },
];

// Editable heading (placeholder — replace later).
const HEADING = "How to use Ask Sai Vidya";

function StepCard({ Icon, title, body }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-[0px_10px_20px_0px_rgba(0,0,0,0.1)]">
      <div className="mb-2 flex items-center gap-2.5">
        <Icon size={26} className="shrink-0 text-primary" />
        <h3 className="text-2xl font-bold text-primary">{title}</h3>
      </div>
      {body && <p className="text-lg text-gray-800">{body}</p>}
    </div>
  );
}

export default function HowToTab() {
  return (
    <div className="relative isolate h-full overflow-hidden">
      <DecorativeBackground hideSwami showDove />
      <div className="flex h-full items-center justify-center overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center">
          {/* Left: Swami illustration + heading */}
          <div className="flex flex-col items-center text-center lg:w-2/5 lg:items-start lg:text-left">
            <img
              src={swami}
              alt="Sathya Sai Baba"
              className="w-44 opacity-90 md:w-56"
            />
            <h1
              className="mt-6 text-3xl font-semibold text-primary"
              style={{ fontFamily: "'EB Garamond', serif" }}
            >
              {HEADING}
            </h1>
          </div>

          {/* Right: the "dialogue" cards, joined by a dashed connector curve */}
          <div className="relative w-full lg:w-3/5 lg:-translate-x-8">
            <div className="relative">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 200 800"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M150 20 C 40 110, 40 200, 150 290 S 40 470, 150 560 S 40 730, 150 790"
                  stroke="#BC5B01"
                  strokeOpacity="0.4"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="relative flex flex-col gap-12">
                {STEPS.map((step, i) => (
                  <div
                    key={step.title}
                    className={i % 2 === 0 ? "lg:ml-auto lg:w-[96%]" : "lg:mr-auto lg:w-[96%]"}
                  >
                    <StepCard {...step} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
