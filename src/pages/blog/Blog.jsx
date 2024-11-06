import React, { useEffect, useState } from "react";
import { LuPencilLine } from "react-icons/lu";
import { IoCalendar } from "react-icons/io5";
import { useQuery } from "react-query";
import { BsChevronBarDown, BsChevronDown } from "react-icons/bs";
import { FaRegUser, FaUserAlt } from "react-icons/fa";
import { IoMdList, IoMdLogIn, IoMdLogOut } from "react-icons/io";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import bgflower from "../../images/bgflower.png";
import Logo from "../../components/logo/Logo";
import { fetchBlogPost } from "../../helpers/apiRoute";
import ErrorPage from "../../components/error/ErrorPage";

export default function Blog() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loggedin, setLoggedin] = useState(true);

  // const [post, setPost] = useState(null);

  // const [, set] = useState();

  const { slugId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  // console.log("🚀 ~ Blog ~ state:", state);

  const { isLoading, isRefetching, data, isError, error, refetch } = useQuery(
    "blogPost",
    () => fetchBlogPost(slugId),
    {
      retry: false,
    },
  );

  useEffect(() => {
    refetch();
  }, [slugId]);

  // console.log("🚀 ~ Blog ~ query:", query);

  // const getPosts = async () => {
  //   const posts = await fetchBlogPost(slugId);
  //   if (posts && posts.length && typeof posts === 'object') {
  //     setBlogPost(posts);
  //   }

  // };

  // useEffect(() => {
  //   getPosts();
  // }, []);

  // const post = {
  //   title: "What is self realization?",
  //   occassion: "Shristi and Dristi",
  //   content: `Pariatur do Lorem reprehenderit ad consequat ad enim id amet amet labore. Veniam ut laborum officia commodo amet pariatur consectetur reprehenderit. Magna quis nulla fugiat est ipsum duis commodo minim culpa pariatur minim. Labore adipisicing et velit fugiat dolor do. Fugiat incididunt culpa velit incididunt velit et do amet ex ipsum id officia id.`,
  //   collection: "SSS, Vol 41Disc. 12",
  // };

  // if (isLoading) return <div>Loading...</div>;
  if (isLoading || isRefetching) {
    return (
      <div className="h-screen flex flex-col bg-transparent">
        <div className="flex flex-auto flex-col justify-center items-center p-4 md:p-5">
          <div className="flex justify-center">
            <div
              className="animate-spin inline-block size-20 border-[3px] border-current border-t-transparent text-orange-400 rounded-full"
              role="status"
              aria-label="loading">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) return <ErrorPage />;

  if (data) {
    // console.log("🚀 ~ Blog ~ data:", data);
    // return <div>{JSON.stringify(data)}</div>;
    const post = data;

    return (
      <div className="w-full">
        <div className="w-full h-[375px] flex flex-col bg-[#FE9F440A] items-center">
          <div className="p-9 flex justify-between w-full">
            {/* nav section */}
            <Logo />
            {loggedin ? (
              <>
                {" "}
                <div className="flex justify-center items-center gap-2 text-orange-400 ">
                  <FaRegUser size={18} />{" "}
                  <span className="font-bold">someone@gmail.com</span>
                  <span
                    className="px-4 cursor-pointer"
                    onClick={() => setShowDropdown((x) => !x)}>
                    <BsChevronDown size={18} />
                    {showDropdown ? (
                      <>
                        <div
                          className="absolute max-w-xs mx-auto  rounded bg-white z-50 right-12 w-[160px] mt-4"
                          style={{
                            boxShadow: "0px 0px 16px 0px #0000001A",
                          }}>
                          <div className="flex w-full  relative justify-end ">
                            <div className=" relative right-4 -top-2 w-0 h-0 border-l-transparent border-r-transparent  border-white border-l-8 border-r-8 border-b-8"></div>
                          </div>

                          <div className="relative  px-2 py-2">
                            <button
                              onClick={() => {
                                setLoggedin(false);
                              }}
                              className="w-full gap-1 shadow px-4 py-2 border  border-orange-400 bg-orange-50  text-black flex items-center rounded justify-between ">
                              Sign out
                              <IoMdLogOut
                                className="text-orange-400"
                                size={18}
                              />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <></>
                    )}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <button className=" gap-1  px-4   text-orange-400  flex items-center rounded justify-between ">
                    <IoMdLogIn className="text-orange-400" size={18} />
                    Sign in
                  </button>
                </Link>
              </>
            )}
          </div>
          <h1 className=" text-[22px] text-center font-bold mb-10">
            {post?.title}
          </h1>

          <Link to="/">
            <button className=" gap-1 shadow px-4 py-2 bg-orange-400 text-white flex items-center rounded mb-2">
              <LuPencilLine size={18} />
              {state?.citations?.length
                ? "Go back to chat"
                : "Ask your question"}
            </button>
          </Link>
          <div>
            <img src={bgflower} alt="" className="w-full " />
          </div>
        </div>
        <div className="flex flex-wrap justify-center  w-[96vw] max:w-[1400px] mx-auto md:gap-12 gap-4 leading-8">
          <div className=" flex flex-col md:w-[800px]  border border-gray-300 rounded shadow p-8 gap-8 relative -top-20 bg-white">
            <h2 className=" text-[20px] mt-4 text-center font-bold text-[#4D4D4D]">
              {post?.occassion}
            </h2>
            <div className="w-full flex justify-between">
              {post.collection && (
                <div className="flex gap-2 text-sm items-center">
                  <IoMdList size={18} className="text-orange-400" />
                  <p className="text-gray-500">{post.collection}</p>
                </div>
              )}

              {post.date && (
                <div className="flex gap-2 text-sm items-center ">
                  <IoCalendar size={18} className="text-orange-400" />
                  <p className="text-gray-500">{post.date}</p>
                </div>
              )}
            </div>
            <div className="p-4 md:p-8  flex flex-col gap-8">
              {/* content */}
              {post?.content?.split("\n").map((text, index) => (
                <React.Fragment key={index}>
                  {text.includes(". ") ? (
                    <p>{text}</p>
                  ) : (
                    <h3 className="text-lg">
                      <strong>{text}</strong>
                    </h3>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {state?.citations?.length && (
            <div className="w-[440px] flex flex-col mt-12 gap-2 mb-12">
              <p>Citations</p>
              {state?.citations?.map((c, i) => (
                <Link
                  to={`/blog/${c._id}`}
                  state={state}
                  key={i}
                  // reloadDocument
                >
                  <div
                    className={`w-[420px] border ${
                      slugId === c._id
                        ? "border-[#FE9F44] bg-[#fe9e4417] "
                        : "border-b hover:bg-[#fe9e4425]"
                    } rounded-lg p-6 flex flex-col gap-4`}>
                    <p className="text-[#4D4D4D]">{c?.title}</p>
                    <div className="flex gap-2 text-sm items-center">
                      <IoMdList size={18} className="text-orange-400" />
                      <p className="text-gray-500">{c?.collection}</p>
                    </div>
                    <div className="flex gap-2 text-sm items-center ">
                      <IoCalendar size={18} className="text-orange-400" />
                      <p className="text-gray-500">{c?.date}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {/* <div className="w-[420px] bg-[##FE9F440A] border border-[#FE9F44] rounded-lg p-6 flex flex-col gap-4">
              <p className="text-[#4D4D4D]">Sristi and Dristhi</p>
              <div className="flex gap-2 text-sm items-center">
                <IoMdList size={18} className="text-orange-400" />
                <p className="text-gray-500">SSS, Vol 29 Disc. 10</p>
              </div>
              <div className="flex gap-2 text-sm items-center ">
                <IoCalendar size={18} className="text-orange-400" />
                <p className="text-gray-500">12 April 1996</p>
              </div>
            </div>
            <div className="w-[420px]  border-b rounded-lg p-6 flex flex-col gap-4">
              <p>Nammi Nammi</p>
              <div className="flex gap-2 text-sm items-center">
                <IoMdList size={18} className="text-orange-400" />
                <p className="text-gray-500">SSS, Vol 29 Disc. 10</p>
              </div>
              <div className="flex gap-2 text-sm items-center ">
                <IoCalendar size={18} className="text-orange-400" />
                <p className="text-gray-500">12 April 1996</p>
              </div>
            </div>
            <div className="w-[420px]  border-b rounded-lg p-6 flex flex-col gap-4">
              <p>Power of meditation</p>
              <div className="flex gap-2 text-sm items-center">
                <IoMdList size={18} className="text-orange-400" />
                <p className="text-gray-500">SSS, Vol 29 Disc. 10</p>
              </div>
              <div className="flex gap-2 text-sm items-center ">
                <IoCalendar size={18} className="text-orange-400" />
                <p className="text-gray-500">12 April 1996</p>
              </div>
            </div> */}
            </div>
          )}
        </div>
      </div>
    );
  }
}
