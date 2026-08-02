import React, { useEffect } from "react";
import leaves from "../../images/leaves.png";
import swami from "../../assets/illustrations/swami.svg";
import Login from "../../components/login/Login";
import Signup from "../../components/signup/Signup";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Signin({ showLogin = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { login: loginUser } = useAuth();

  const isLoginPage = location.pathname === "/signin";

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userEncoded = params.get('user');
    const success = params.get('success');
    const error = params.get('error');

    if (success && token && userEncoded) {
      try {
        const user = JSON.parse(decodeURIComponent(userEncoded));

        // Store token and user (same as regular login)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Update auth context. Pass the whole user object, not just the email —
        // the Navbar renders first_name/last_name for non-Auth0 users, so
        // dropping them here leaves the signed-in name blank.
        loginUser({ email: user.email, token, isGoogleLogin: true, user });

        // Redirect to home
        navigate('/home', { replace: true });
      } catch (err) {
        alert('Failed to process login. Please try again.');
      }
    } else if (error) {
      const errorMessages = {
        'oauth_failed': 'Google login failed. Please try again.',
        'no_code': 'Authorization code not received from Google.',
        'no_email': 'Could not retrieve email from Google account.'
      };
      alert(errorMessages[error] || 'An error occurred during login.');
    }
  }, [location.search, loginUser, navigate]);

  // const [login, setlogin] = useState(showLogin ? true : false);
  // useEffect(() => {
  //   setlogin((x) => !x);
  // }, [showLogin]);

  return (
    <div className="bg-[#fffbf8] w-full h-[100dvh] text-gray-800 overflow-hidden">
      <div
        className="absolute top-0 left-0 h-full w-full bg-no-repeat opacity-100 bg-cover sm:bg-contain"
        style={{ backgroundImage: `url("${leaves}")` }}
      />
      <img
        src={swami}
        alt=""
        aria-hidden="true"
        className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-0 w-24 sm:w-32 opacity-40 md:opacity-60 md:w-44 pointer-events-none select-none"
      />
      <div className="flex h-full min-h-0">
        <div className="hidden md:flex flex-col items-center justify-center flex-grow">
          <div className="lg:w-[600px] p-4">
            <h1 className="text-3xl font-bold text-primary">
              Welcome to Ask Sai Vidya!
            </h1>
            <p className="leading-relaxed mt-4 tracking-wide">
              Embark on a spiritual journey with Sathya Sai Baba to find deeper
              understanding. Seek answers to your questions and engage directly
              for inner peace.
            </p>
          </div>
        </div>
        <div className="w-full lg:w-[600px] h-full bg-white flex justify-center items-start sm:items-center overflow-y-auto py-8 sm:py-12 md:py-20 px-4 sm:px-8 md:px-10 z-10">
          <div className="w-full max-w-[400px]">
            <div className="md:hidden mb-6 text-center">
              <h1 className="text-2xl font-bold text-primary">Ask Sai Vidya</h1>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Sign in to save your questions, discourses, and highlights.
              </p>
            </div>
            <div className="w-full flex">
              <div
                className={` w-full transition-all ease-in flex justify-center items-center py-4 text-lg font-bold ${isLoginPage
                  ? "border-b border-primary"
                  : " border-b border-gray-200 text-gray-400"
                  }`}
                onClick={() => navigate("/signin", { replace: true })}>
                <Link to="/signin">Sign in</Link>
              </div>
              <div
                className={`w-full transition-all ease-in flex justify-center items-center text-lg font-bold ${!isLoginPage
                  ? "border-b border-primary"
                  : " border-b border-gray-200 text-gray-400"
                  }`}
                onClick={() => navigate("/signup", { replace: true })}>
                <Link to="/signup" className="py-4">
                  Sign up
                </Link>
              </div>
            </div>
            {isLoginPage ? (
              <>
                <Login inModal={false} />
              </>
            ) : (
              <>
                <Signup inModal={false} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
