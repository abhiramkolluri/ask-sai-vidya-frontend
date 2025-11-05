import React, { useState } from "react";
import leaves from "../../../images/leaves.png";
import MaterialInput from "../../../components/input/MaterialInput";
import { Link } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function Reset() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/password/reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Password reset link has been sent to your email.");
        setEmail("");
      } else {
        setError(data.error || "Failed to send reset link. Please try again.");
      }
    } catch (err) {
      console.error('Error requesting password reset:', err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" bg-[#fffbf8]  w-full h-[100vh] text-gray-800 text-[14px]">
      <div className="absolute top-0 left-0">
        <img src={leaves} alt="" />
      </div>
      <div className=" flex  h-full ">
        <div className="hidden md:flex flex-col items-center justify-center  flex-grow">
          <div className="w-[600px]">
            <h1 className=" text-2xl font-bold text-orange-400">
              Connect with Ask Sai Vidya!
            </h1>
            <p className=" leading-relaxed mt-4 tracking-wide">
              Embark on a spiritual journey with Sathya Sai Baba to find deeper
              understanding. Seek answers to your questions and engage directly
              for inner peace.
            </p>
          </div>
        </div>
        <div className="w-[600px] h-full bg-white flex justify-center items-center px-10">
          <div className="p-8 w-[400px]">
            <div className=" flex flex-col gap-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 ">
                <h1 className="text-center my-4 text-xl font-semibold">Forgot Password</h1>

                {message && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <p className="text-gray-600 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <div>
                  <MaterialInput
                    text="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-[40px] font-bold text-white shadow flex justify-center items-center rounded ${loading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-400 hover:bg-orange-500'
                    }`}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <h1 className="text-center font-thin">
                Remember your password?{" "}
                <Link to="/signin" className="text-orange-400">
                  <span className=" text-orange-400 cursor-pointer font-medium hover:underline">
                    Sign In
                  </span>{" "}
                </Link>
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
