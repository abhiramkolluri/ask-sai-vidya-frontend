import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { IoMdLogIn } from "react-icons/io";
import Login from "../login/Login";
import Signup from "../signup/Signup";

const LoginButton = () => {
  const { loginWithAuth0, user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Close modals when user successfully logs in
  React.useEffect(() => {
    if (user) {
      closeAllModals();
    }
  }, [user]);

  // For now, we'll show the custom login modal by default
  // You can change this to use Auth0 by uncommenting the Auth0 line below
  const handleLoginClick = () => {
    setShowLoginModal(true);
    // loginWithAuth0(); // Uncomment this to use Auth0 instead
  };

  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  const closeAllModals = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  return (
    <>
      <button
        onClick={handleLoginClick}
        className="gap-1 px-4 text-primary flex items-center rounded justify-between"
      >
        <IoMdLogIn className="text-primary" size={18} />
        Sign in
      </button>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={closeAllModals}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
            <Login
              callback={handleSwitchToSignup}
              inModal={true}
            />
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={closeAllModals}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
            <Signup
              callback={closeAllModals}
              inModal={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default LoginButton; 