import React, { useState } from "react";
import Logo from "../../components/logo/Logo";
import SideNav from "../../components/sidenav/SideNav";
import ChatBox from "../../components/chatbox/ChatBox";

const Chatpage = () => {
  const [newChat, setnewChat] = useState(Math.random());
  const handleNewChat = () => {
    setnewChat(Math.random());
  };
  return (
    <div className="w-full h-[100vh] flex overflow-hidden ">
      <div className="w-[300px] bg-white shadow-lg  flex-col overflow-hidden hidden md:block md:flex flex-shrink-0">
        {/* this will hold the side nav section */}
        <SideNav startNewChatCallback={handleNewChat} />
      </div>
      <div className="flex flex-grow ">
        {/* this will hold the chat section */}
        <ChatBox newChat={newChat} />
      </div>
    </div>
  );
};

export default Chatpage;
