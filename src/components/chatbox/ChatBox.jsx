import React, { useState, useEffect, useRef } from "react";
import { RiSendPlane2Fill, RiSendPlane2Line } from "react-icons/ri";

import SampleQuestions from "../sample/SampleQuestions";
import Reply from "../chat/reply/Reply";
import { BsPersonVideo } from "react-icons/bs";

export default function ChatBox({
	newChat,
	loggedin = false,
	modalCallback = () => {},
}) {
	const [questions, setQuestions] = useState([]);
	const [askQuestion, setAskQuestion] = useState("");
	const containerRef = useRef(null);
	const [count, setCount] = useState(0);
	const [loggedIn, setloggedIn] = useState(false);
	const inputRef = useRef(null);

	const fetchPrimaryResponse = async (question) => {
		if ([question]?.primaryResponse) {
			return {
				response: [question].primaryResponse,
				fetchCitations: [question].fetchCitations,
			};
		}
		const response = await fetch(
			"http://localhost:5000/api/primarysource/query",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ query: question }),
			}
		);
	};
	const fetchCitations = async (question) => {
		if ([question]?.citations) {
			return [question].citations;
		}
		const response = await fetch("http://localhost:5000/search", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query: question }),
		});
		const data_citations = await response.json();
		[question] = { ...[question], citations: data_citations };
		console.log("Citations response:", data_citations); // Debugging log
		return data_citations; // Ensure this matches your actual API response structure
	};

	const handleSend = async () => {
		const val = inputRef.current.value.trim();
		if (val.length > 0) {
			setAskQuestion("");
			inputRef.current.value = "";

			const newIndex = questions.length;
			setQuestions((prevQuestions) => [
				...prevQuestions,
				{ question: val, reply: null },
			]);

			try {
				const primaryResponsePromise = fetchPrimaryResponse(val);
				const citationsPromise = primaryResponsePromise.then((result) => {
					if (result.fetchCitations) {
						return fetchCitations(val);
					}
					return [];
				});

				const [primaryResponse, citations] = await Promise.all([
					primaryResponsePromise,
					citationsPromise,
				]);

				// Update state once with both responses
				setQuestions((prevQuestions) =>
					prevQuestions.map((q, index) =>
						index === newIndex
							? {
									...q,
									reply: {
										primaryResponse: primaryResponse.response,
										citations,
									},
							  }
							: q
					)
				);
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		}
	};

	const handleKeyPress = async (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			await handleSend();
		}
	};

	useEffect(() => {
		if (containerRef.current)
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
	}, [questions]);

	useEffect(() => {
		setQuestions([]);
	}, [newChat]);

	const SendIcon = askQuestion?.length ? RiSendPlane2Fill : RiSendPlane2Line;

	return (
		<div className="w-full flex flex-col h-[100vh]">
			{questions.length > 0 ? (
				<div
					ref={containerRef}
					className="flex-grow overflow-y-scroll flex flex-col no-scrollbar mx-auto p-2 md:p-6 w-[98%] md:w-[80%] "
				>
					{questions.map((ques, index) => (
						<Reply key={index} question={ques.question} reply={ques.reply} />
					))}
				</div>
			) : (
				<div className="flex-grow overflow-y-scroll flex justify-center items-center">
					<div className="flex flex-col w-8/12 items-center justify-center gap-4">
						<p className="p-2 text-gray-500 font-light text-justify min-w-[350px] text-xl">
							Ask your question to&nbsp;<b>Sai Vidya</b> and discover profound
							wisdom!
						</p>
						<div>
							<SampleQuestions />
						</div>
					</div>
				</div>
			)}

			<div className="p-4 md:p-8">
				<div className="flex justify-center border border-gray-300 gap-2 rounded">
					<textarea
						ref={inputRef}
						className="flex-grow rounded p-4 resize-none outline-none text-lg"
						id="textBox"
						cols="10"
						rows="4"
						placeholder="Start your question"
						onKeyDown={handleKeyPress}
					/>
					<div className="text-gray-300 p-2">
						<SendIcon
							className="cursor-pointer hover:shadow-lg"
							onClick={handleSend}
							size={24}
							color="#FE9F44"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
