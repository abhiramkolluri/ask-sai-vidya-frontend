import React, { useState } from "react";
import Logo from "../../components/logo/Logo";
import SideNav from "../../components/sidenav/SideNav";
import ChatBox from "../../components/chatbox/ChatBox";
import Login from "../../components/login/Login";
import Signup from "../../components/signup/Signup";
import Navbar from "../../components/navbar/navbar";

const Chatpage = () => {
  const [newChat, setnewChat] = useState(Math.random());
  const [showModal, setshowModal] = useState(false);
  const [showlogin, setshowlogin] = useState(false);
  const handleShowModal = () => {
    console.log("show modal");
    setshowModal(true);
  };
  const handleNewChat = () => {
    setnewChat(Math.random());
  };
  return (
    <div className="w-full h-[100vh] flex overflow-hidden ">
      <div className="w-[300px] bg-white shadow-lg  flex-col overflow-hidden hidden md:block md:flex flex-shrink-0">
        {/* this will hold the side nav section */}
        <SideNav startNewChatCallback={handleNewChat} />
      </div>
      <div className="absolute top-0 left-0 right-0">
        <Navbar />
      </div>
      <div className="flex flex-col flex-grow mt-16">
        {/* this will hold the chat section */}
        <ChatBox newChat={newChat} modalCallback={() => handleShowModal()} />
      </div>
      {showModal ? (
        <>
          <div
            className="absolute top-0 bottom-0 right-0 left-0 flex justify-center items-center bg-black bg-opacity-20 z-50"
            onClick={handleShowModal}>
            {showlogin ? (
              <>
                <Login callback={() => setshowlogin(false)} />
              </>
            ) : (
              <>
                <Signup callback={() => setshowlogin(true)} />
              </>
            )}
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Chatpage;
