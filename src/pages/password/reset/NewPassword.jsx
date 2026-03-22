import React, { useState, useEffect } from "react";
import leaves from "../../../images/leaves.png";
import MaterialInput from "../../../components/input/MaterialInput";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function NewPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Get token from URL query parameters
    const tokenFromUrl = searchParams.get('token');

    if (!tokenFromUrl) {
      setError("Invalid reset link. Please request a new password reset.");
      setVerifying(false);
      return;
    }

    setToken(tokenFromUrl);
    verifyToken(tokenFromUrl);
  }, [searchParams]);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_BASE_URL}/password/reset/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setTokenValid(true);
        setEmail(data.email);
      } else {
        setError(data.error || "Invalid or expired reset link.");
        setTokenValid(false);
      }
    } catch (err) {
      console.error('Error verifying token:', err);
      setError("Failed to verify reset link. Please try again.");
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/password/reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          password: newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Password reset successful! Redirecting to sign in...");
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      } else {
        setError(data.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      console.error('Error resetting password:', err);
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
            {verifying ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
                <p className="mt-4 text-gray-600">Verifying reset link...</p>
              </div>
            ) : !tokenValid ? (
              <div className="flex flex-col gap-4">
                <h1 className="text-center text-xl font-semibold text-red-600">Invalid Reset Link</h1>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
                <button
                  onClick={() => navigate('/password/reset')}
                  className="w-full h-[40px] font-bold text-white bg-orange-400 hover:bg-orange-500 shadow flex justify-center items-center rounded"
                >
                  Request New Reset Link
                </button>
              </div>
            ) : (
              <div className=" flex flex-col gap-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 ">
                  <h1 className="text-center my-4 text-xl font-semibold">Reset Password</h1>

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

                  <div>
                    <MaterialInput
                      text="Email address"
                      value={email}
                      disabled={true}
                    />
                  </div>
                  <div>
                    <MaterialInput
                      text="New password"
                      password
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <MaterialInput
                      text="Confirm new password"
                      password
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    Password must be at least 6 characters long
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full h-[40px] font-bold text-white shadow flex justify-center items-center rounded ${loading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-400 hover:bg-orange-500'
                      }`}
                  >
                    {loading ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
