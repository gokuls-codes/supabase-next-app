import { RealtimeChat } from "@/components/realtime-chat";
import React from "react";

const ChatPage = () => {
  return (
    <div>
      <RealtimeChat roomName="default" username="gokul2" />
    </div>
  );
};

export default ChatPage;
