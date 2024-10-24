import React from "react";

function ErrorPage(props) {
  return (
    <div>
      <div className="bg-gray-100 font-sans leading-normal tracking-normal h-screen flex items-center justify-center">
        <div className="bg-white shadow-2xl rounded-xl p-10 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Something went wrong
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Oops! It seems you've stumbled upon a page that doesn't exist.
          </p>
          <p className="text-gray-500 mb-4">
            We couldn't find the page you were looking for. It might have been
            removed, or the URL might be incorrect.
          </p>
          <a
            href="/"
            className="inline-block bg-orange-400 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-400 transition-all duration-300 ease-in-out">
            Go Back Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
