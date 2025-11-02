"use client";

import { createClient } from "@/lib/supabase/client";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

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

export type IncomingBuzz = {
  key: string;
  username: string;
  buzzedAt: Date;
};

const PingDisplay = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = searchParams.get("roomId") || "";
  // const [currentRoomId, setCurrentRoomId] = useState(roomId);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const supabase = createClient();
  const [isBuzzDisabled, setIsBuzzDisabled] = useState(false);

  const [userName, setUserName] = useState("");
  const [submittedUserName, setSubmittedUserName] = useState("");
  const [channel, setChannel] = useState<ReturnType<
    typeof supabase.channel
  > | null>(null);
  const [isBuzzActive, setIsBuzzActive] = useState(false);
  // const [isConnected, setIsConnected] = useState(false);
  // const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [incomingBuzzes, setIncomingBuzzes] = useState<IncomingBuzz[]>([]);
  const [buzzEnabledAt, setBuzzEnabledAt] = useState<Date | null>(null);

  const [ping, setPing] = useState<number>();

  useEffect(() => {
    if (!submittedUserName || !roomId) {
      return;
    }

    const newChannel = supabase.channel(roomId + ":buzzer", {
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

    newChannel.on("broadcast", { event: "action" }, (payload) => {
      if (payload.payload.user.key === roomId) {
        console.log("Received action:", payload);
        if (payload.payload.action === "reset-buzz") {
          setIncomingBuzzes([]);
          setIsBuzzActive(false);
          setIsBuzzDisabled(false);
        }
        if (payload.payload.action === "enable-buzz") {
          setBuzzEnabledAt(new Date());
          setIsBuzzActive(true);
        }
      }
    });

    newChannel.on("broadcast", { event: "buzz" }, (payload) => {
      const newBuzz: IncomingBuzz = {
        key: payload.payload.user.key,
        username: payload.payload.user.name,
        buzzedAt: new Date(payload.payload.sentAt),
      };
      console.log("New buzz:", newBuzz);
      setIncomingBuzzes((current) => [...current, newBuzz]);
    });

    setChannel(newChannel);

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [submittedUserName, supabase, roomId]); // Empty dependency array ensures this runs once on mount

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

  const sendBuzz = async () => {
    if (!channel) return;

    setIsBuzzDisabled(true);
    setIsBuzzActive(false);

    if (isBuzzDisabled) return;
    if (!isBuzzActive) return;

    const message = {
      id: crypto.randomUUID(),
      sentAt: new Date().toISOString(),
      user: {
        name: submittedUserName,
        key: submittedUserName,
      },
    };

    await channel.send({
      type: "broadcast",
      event: "buzz",
      payload: message,
    });
  };

  const sendAction = async (actionName: string) => {
    if (!channel) return;
    if (roomId !== submittedUserName) return;

    const message = {
      id: crypto.randomUUID(),
      sentAt: new Date().toISOString(),
      user: {
        name: submittedUserName,
        key: submittedUserName,
      },
      action: actionName,
    };
    await channel.send({
      type: "broadcast",
      event: "action",
      payload: message,
    });
  };

  return (
    <div className="  p-4 rounded-md space-y-8 w-full max-w-sm mx-auto">
      <h2 className=" text-xl font-semibold text-center">
        {roomId}&apos;s-Room
      </h2>
      {!submittedUserName ? (
        <div className=" flex flex-col gap-4">
          {roomId ? (
            <>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <Button onClick={() => setSubmittedUserName(userName)}>
                Join room
              </Button>
            </>
          ) : (
            <>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <Button
                onClick={() => {
                  setSubmittedUserName(userName);
                  router.push(`?roomId=${userName}`);
                }}
              >
                Create room
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className=" flex gap-4 justify-between">
            <div className=" space-y-2">
              <h2>Online Users:</h2>
              <ul>
                {onlineUsers.map((user, index) => (
                  <li key={index}>
                    {user.username}
                    {user.username === roomId ? "👑" : ""}
                  </li>
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

          {roomId === submittedUserName ? (
            <div className=" flex gap-4 ">
              {isBuzzActive ? (
                <Button
                  onClick={() => sendAction("reset-buzz")}
                  variant={"destructive"}
                  className=" flex-1 "
                  size={"lg"}
                >
                  Reset Buzzers
                </Button>
              ) : (
                <Button
                  onClick={() => sendAction("enable-buzz")}
                  className=" flex-1 "
                  size={"lg"}
                >
                  Enable Buzzers
                </Button>
              )}
            </div>
          ) : (
            <div
              className={cn(
                " size-40 rounded-full  text-white flex items-center justify-center mx-auto cursor-pointer",
                isBuzzActive
                  ? " bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700",
                isBuzzDisabled
                  ? "opacity-80 cursor-not-allowed bg-neutral-600 hover:bg-neutral-600"
                  : ""
              )}
              onClick={() => sendBuzz()}
            >
              <p className=" font-semibold text-3xl">Hit Me!</p>
            </div>
          )}

          {buzzEnabledAt && (
            <div className="">
              {incomingBuzzes.length > 0 && <h3>Incoming Buzzes:</h3>}
              <ul>
                {incomingBuzzes.map((buzz, index) => (
                  <li key={index}>
                    {buzz.username}{" "}
                    {buzz.buzzedAt.getTime() - buzzEnabledAt?.getTime()} ms
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PingDisplay;
