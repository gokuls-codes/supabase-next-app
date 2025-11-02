import { RealtimeChat } from "@/components/realtime-chat";
import React from "react";

const ChatPage = () => {
  return (
    <div>
      <RealtimeChat roomName="default" username="gokul" />
    </div>
  );
};

export default ChatPage;
