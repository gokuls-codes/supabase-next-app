"use client";

import { createClient } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface ChatMessage {
  id: string;
  content: string;
  user: {
    name: string;
  };
  createdAt: string;
}

export type PresenceUser = {
  key: string;
  username: string;
  presence_ref: string;
};

const PingDisplay = () => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const supabase = createClient();

  const [userName, setUserName] = useState("");
  const [submittedUserName, setSubmittedUserName] = useState("");
  const [channel, setChannel] = useState<ReturnType<
    typeof supabase.channel
  > | null>(null);
  // const [isConnected, setIsConnected] = useState(false);
  // const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [ping, setPing] = useState<number>();

  useEffect(() => {
    if (!submittedUserName) {
      return;
    }

    const newChannel = supabase.channel("room:1", {
      config: {
        broadcast: {
          self: true,
        },
        presence: {
          key: submittedUserName,
        },
      },
    });

    // Subscribe to presence events
    newChannel
      .on("presence", { event: "sync" }, () => {
        const newState = newChannel.presenceState();
        // Process newState to get a list of online users

        console.log("new state", newState);
        const users: PresenceUser[] = Object.entries(newState).flatMap(
          ([key, presences]) =>
            presences.map((p) => ({
              key: key,
              username: (p as unknown as PresenceUser).username || key,
              presence_ref: p.presence_ref || "",
            }))
        );
        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
        // Update onlineUsers state
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
        // Update onlineUsers state
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const trackResponse = await newChannel.track({
            key: submittedUserName,
            username: submittedUserName,
          }); // Track user's presence

          console.log("Track response:", trackResponse);
        }
      });

    newChannel
      .on("broadcast", { event: "ping" }, (payload) => {
        console.log("Received ping:", payload);

        if (payload.payload.user.key === submittedUserName) {
          const receivedAt = new Date();
          const sentAt = new Date(payload.payload.sentAt);

          setPing(receivedAt.getTime() - sentAt.getTime());
        }

        // setMessages((current) => [...current, payload.payload as ChatMessage]);
      })
      .subscribe(async (status) => {
        console.log("Broadcast subscribe status:", status);
        // if (status === "SUBSCRIBED") {
        //   setIsConnected(true);
        // } else {
        //   setIsConnected(false);
        // }
      });

    setChannel(newChannel);

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [submittedUserName, supabase]); // Empty dependency array ensures this runs once on mount

  const sendPing = async () => {
    if (!channel) return;

    const message = {
      id: crypto.randomUUID(),
      sentAt: new Date().toISOString(),
      user: {
        name: submittedUserName,
        key: submittedUserName,
      },
    };
    console.log("Sending ping:", message);
    await channel.send({
      type: "broadcast",
      event: "ping",
      payload: message,
    });
  };

  return (
    <div className=" border p-4 rounded-md h-[30vh] w-[320px] space-y-8">
      <h2 className=" text-xl font-semibold text-center">Buzz-Room</h2>
      {!submittedUserName ? (
        <div className=" flex flex-col gap-4">
          <Input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <Button onClick={() => setSubmittedUserName(userName)}>Join</Button>
        </div>
      ) : (
        <div className=" flex gap-4 justify-between">
          <div className=" space-y-2">
            <h2>Online Users:</h2>
            <ul>
              {onlineUsers.map((user, index) => (
                <li key={index}>{user.username}</li>
              ))}
            </ul>
          </div>
          <div className=" space-y-2">
            <Button onClick={sendPing} variant={"outline"}>
              Ping
            </Button>

            {ping && <p>{ping} ms</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PingDisplay;
