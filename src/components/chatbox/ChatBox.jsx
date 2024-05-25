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
	const [questions, setquestion] = useState([]);
	const [askQuestion, setaskQuestion] = useState("");
	const containerRef = useRef(null);
	const [count, setcount] = useState(0);
	const [loggedIn, setloggedIn] = useState(false);
	const inputRef = useRef(null);

	const chat = [
		{
			question: "this is the question",
			reply: {
				answer: "this is the answer",
				date: "12/12/2021",
			},
		},
	];
	console.log(count);
	useEffect(() => {
		console.log(count);
		if (count > 3) {
			console.log("exectung call back");
			modalCallback();
		}
	}, [count]);

	const fecthPrimaryResponse = async (question) => {
		if ([question]?.primaryResponse) {
			return {
				response: [question].primaryResponse,
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
			[question] = {
				...[question],
				citations: data_citations,
      };
      
      console.log("Citations response", data_citations); //Debugging purpose

      return data_citations; //Return the citations from API response structure

			const handleKeyPress = async (event) => {
				// Check if the pressed key is the "Enter" key

				const val = inputRef.current.value;
				setaskQuestion(val.trim());

				if (event.key === "Enter") {
					event.preventDefault();

					if (val?.trim()?.length < 1) return;

					setcount((x) => x + 1);

					setquestion((x) => [...x, val.trim()]);
					inputRef.current.value = "";
				}
			};

			useEffect(() => {
				setquestion((x) => []);
			}, [newChat]);

			useEffect(() => {
				// Scroll to the end of the div
				if (containerRef.current)
					containerRef.current.scrollTop = containerRef.current.scrollHeight;
			}, [question]);

			const SendIcon = askQuestion?.length
				? RiSendPlane2Fill
				: RiSendPlane2Line;

			return (
				<div className="w-full flex flex-col h-[100vh]">
					{question.length > 0 ? (
						<>
							<div
								ref={containerRef}
								className="flex-grow overflow-y-scroll flex flex-col no-scrollbar mx-auto p-2 md:p-6 w-[98%] md:w-[80%] "
							>
								{question.map((ques, index) => {
									return (
										<>
											<Reply question={ques} key={index} />
										</>
									);
								})}
							</div>
						</>
					) : (
						<>
							<div className="flex-grow overflow-y-scroll flex justify-center items-center">
								<div className="flex flex-col  w-8/12  items-center justify-center gap-4">
									<p className=" p-2 text-gray-500 font-light text-justify min-w-[350px] text-xl">
										Ask your question to&nbsp;
										<b>Sai Vidya</b> and discover profound wisdom!
									</p>
									<div>
										<SampleQuestions />
									</div>
								</div>
							</div>
						</>
					)}

					<div className="  p-4 md:p-8 ">
						<div className="flex  justify-center  border border-gray-300 gap-2 rounded">
							<textarea
								ref={inputRef}
								className="flex-grow  rounded p-4 resize-none outline-none text-lg"
								id="textBox"
								cols="10"
								rows="4"
								placeholder="Start your question"
								// value={askQuestion}
								// onChange={(e) => {
								//   setaskQuestion(e.target.value);
								//   // clearInput();
								// }}
								onKeyDown={(e) => handleKeyPress(e)}
							/>
							<div className="text-gray-300 p-2">
								<SendIcon
									className="cursor-pointer hover:shadow-lg disabled:!shadow-bg"
									onClick={() => {
										setaskQuestion("");
										inputRef.current.focus();
										setcount((x) => x + 1);
										askQuestion.length > 0 &&
											setquestion((x) => [...x, askQuestion]);
									}}
									size={24}
									color="#FE9F44"
									disabled={!askQuestion.length}
								/>
							</div>
						</div>
					</div>
				</div>
			);
		};
	};
}
