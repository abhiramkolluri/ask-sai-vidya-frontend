import React, { useEffect } from "react";
import leaves from "../../images/leaves.png";
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

        // Update auth context
        loginUser({ email: user.email, token, isGoogleLogin: true });

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
    <div className=" bg-[#fffbf8] dark:bg-gray-900  lg:w-full md:w-auto h-[100vh] text-gray-800 dark:text-gray-200">
      <div
        className="absolute top-0 left-0 h-full w-full bg-no-repeat opacity-100 dark:opacity-20"
        style={{ backgroundImage: `url("${leaves}")` }}>
        {/* <img src={leaves} alt="" /> */}
      </div>
      <div className=" flex  h-full ">
        <div className="hidden md:flex flex-col items-center justify-center  flex-grow">
          <div className="lg:w-[600px] p-4">
            <h1 className=" text-3xl font-bold text-primary dark:text-orange-400">
              Welcome to Ask Sai Vidya!
            </h1>
            <p className=" leading-relaxed mt-4 tracking-wide dark:text-gray-300">
              Embark on a spiritual journey with Sathya Sai Baba to find deeper
              understanding. Seek answers to your questions and engage directly
              for inner peace.
            </p>
          </div>
        </div>
        <div className="sm:w-[100%] lg:w-[600px] h-full bg-white dark:bg-gray-800 flex justify-center py-20 px-10 z-10">
          <div>
            <div className="w-full flex ">
              <div
                className={` w-full transition-all ease-in flex justify-center items-center py-4 text-lg font-bold ${isLoginPage
                    ? "border-b border-primary dark:border-orange-400"
                    : " border-b border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
                  }`}
                onClick={() => navigate("/signin", { replace: true })}>
                <Link to="/signin">Sign in</Link>
              </div>
              <div
                className={`w-full transition-all ease-in flex justify-center items-center text-lg font-bold ${!isLoginPage
                    ? "border-b border-primary dark:border-orange-400"
                    : " border-b border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
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
