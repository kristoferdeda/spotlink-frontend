import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import socket from "../socket";
import api from "../api";

interface Message {
  senderId: string;
  receiverId: string;
  message: string;
}

interface ChatUser {
  _id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

const isSentByCurrentUser = (msgSenderId: string, currentUserId: string) => {
  return String(msgSenderId) === String(currentUserId);
};

const FloatingChat = () => {
  const { user, token } = useAuth()!;
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/chat/conversations/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const enrichedUsers = res.data.users.map((u: ChatUser) => {
        const existing = users.find((x) => x._id === u._id);
        return {
          ...u,
          unreadCount: existing?.unreadCount || 0,
        };
      });

      setUsers(
        enrichedUsers.sort((a: ChatUser, b: ChatUser) =>
          (b.lastMessageTime || "").localeCompare(a.lastMessageTime || "")
        )
      );
    } catch (err) {
      console.error("❌ Failed to fetch conversations:", err);
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    const join = () => {
      socket.emit("join_room", user._id);
    };

    socket.on("connect", join);
    if (socket.connected) join();

    return () => {
      socket.off("connect", join);
    };
  }, [user]);

  useEffect(() => {
    if (!token) return;

    const handleReceiveMessage = async (data: Message) => {
      try {
        const isCurrentChat =
          selectedUser?._id &&
          (data.senderId === selectedUser._id || data.receiverId === selectedUser._id);

        if (isCurrentChat) {
          setMessages((prev) => [...prev, data]);
          return;
        }

        if (data.receiverId !== user._id) return;

        setUsers((prevUsers) => {
          const exists = prevUsers.find((u) => u._id === data.senderId);
          if (exists) {
            const updated = [...prevUsers]
              .map((u) =>
                u._id === data.senderId
                  ? {
                      ...u,
                      unreadCount: (u.unreadCount || 0) + 1,
                      lastMessage: data.message,
                      lastMessageTime: new Date().toISOString(),
                    }
                  : u
              )
              .sort((a, b) =>
                (b.lastMessageTime || "").localeCompare(a.lastMessageTime || "")
              );
            return updated;
          } else {
            api
              .get(`/chat/user/${data.senderId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((res) => {
                const newUser: ChatUser = {
                  _id: res.data._id,
                  name: res.data.name,
                  lastMessage: data.message,
                  lastMessageTime: new Date().toISOString(),
                  unreadCount: 1,
                };

                setUsers((latestUsers) => {
                    const withoutDupes = latestUsers.filter((u) => u._id !== newUser._id);
                    return [newUser, ...withoutDupes].sort((a, b) =>
                      (b.lastMessageTime || "").localeCompare(a.lastMessageTime || "")
                    );
                  });                  
              })
              .catch((err) => {
                console.error("❌ Could not fetch new user:", err);
              });

            return prevUsers;
          }
        });
      } catch (err) {
        console.error("❌ Error in handleReceiveMessage:", err);
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [token, selectedUser?._id, user]);

  useEffect(() => {
    if (token) fetchConversations();
  }, [token]);

  const loadMessages = async (chatUser: ChatUser) => {
    try {
      const res = await api.get(`/chat/${chatUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = res.data.messages.map((msg: any) => ({
        senderId: String(msg.sender),
        receiverId: String(msg.receiver),
        message: msg.message,
      }));

      setMessages(formatted);
      setSelectedUser(chatUser);

      setUsers((prev) =>
        prev.map((u) => (u._id === chatUser._id ? { ...u, unreadCount: 0 } : u))
      );
    } catch (err) {
      console.error("❌ Failed to load messages:", err);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const messageData = {
      senderId: user._id,
      receiverId: selectedUser._id,
      message: newMessage,
    };

    socket.emit("send_message", messageData);
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");
  };

  const handleClearChat = async () => {
    if (!selectedUser || !token) return;
    if (!confirm("Clear this conversation?")) return;

    try {
      await api.post(`/chat/clear/${selectedUser._id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
      fetchConversations();
    } catch (err) {
      alert("❌ Failed to clear chat.");
    }
  };

  const handleDeleteConversation = async (userId: string) => {
    if (!confirm("Delete this conversation from your list?")) return;

    try {
      await api.post(`/chat/clear/${userId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((u) => u._id !== userId));
      if (selectedUser?._id === userId) {
        setSelectedUser(null);
        setMessages([]);
      }
      fetchConversations();
    } catch (err) {
      alert("❌ Failed to delete conversation.");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const unreadTotal = users.reduce((sum, u) => sum + (u.unreadCount || 0), 0);

  return (
    <>
        <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 left-4 z-[9999] bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg text-xl"
        >
        💬
        {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-2 rounded-full">
            {unreadTotal}
            </span>
        )}
        </button>


      {open && (
        <div className="fixed bottom-20 left-4 w-80 h-[450px] bg-white shadow-lg rounded-lg overflow-hidden flex flex-col z-50">
          <div className="bg-blue-600 text-white p-2 text-center font-bold relative">
            {selectedUser ? (
              <button onClick={() => setSelectedUser(null)} className="absolute left-2 top-1/2 -translate-y-1/2">
                ←
              </button>
            ) : (
              "Chats"
            )}
            {selectedUser?.name}
            {selectedUser && (
              <button
                onClick={handleClearChat}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-sm"
                title="Clear Chat"
              >
                🗑️
              </button>
            )}
            <button onClick={() => setOpen(false)} className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-lg">
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {selectedUser ? (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`my-2 ${isSentByCurrentUser(msg.senderId, user._id) ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block px-3 py-2 rounded-lg ${
                      isSentByCurrentUser(msg.senderId, user._id)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))
            ) : (
              <ul>
                {users.map((chatUser) => (
                  <li key={chatUser._id} className="p-2 border-b flex justify-between items-center hover:bg-gray-100">
                    <span className="cursor-pointer flex-1" onClick={() => loadMessages(chatUser)}>
                      <div className="font-semibold">{chatUser.name}</div>
                      <div className="text-xs text-gray-600 truncate">{chatUser.lastMessage}</div>
                    </span>
                    <div className="flex items-center gap-2">
                      {chatUser.unreadCount! > 0 && (
                        <span className="bg-red-600 text-white text-xs px-2 rounded-full">
                          {chatUser.unreadCount}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteConversation(chatUser._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Remove from list"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div ref={messagesEndRef} />
          </div>

          {selectedUser && (
            <div className="p-2 border-t flex">
              <input
                type="text"
                className="flex-1 border p-2 rounded-l-md"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-r-md disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingChat;
