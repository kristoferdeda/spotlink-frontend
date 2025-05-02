import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../../socket";

interface ChatUser {
  _id: string;
  name: string;
  unreadCount?: number;
  lastMessageTime?: string;
}

interface Message {
  senderId: string;
  receiverId: string;
  message: string;
}

const ChatsPage = () => {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";
  const userId = localStorage.getItem("userId") || "";

  const fetchConversations = () => {
    axios
      .get("/api/chat/conversations/summary", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const usersWithMeta = res.data.users.map((u: ChatUser) => ({
          ...u,
          unreadCount: 0,
        }));
  
        const sortedUsers = usersWithMeta.sort((a: ChatUser, b: ChatUser) =>
            (b.lastMessageTime || "").localeCompare(a.lastMessageTime || "")
          );
          
  
        setUsers(sortedUsers);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch chat conversations:", err);
      });
  };
  

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!userId) return;

    socket.emit("join_room", userId);

    const handleMessage = async (data: Message) => {
      if (data.receiverId !== userId) return;

      const exists = users.find((u) => u._id === data.senderId);
      if (exists) {
        const updated = users
          .map((u) =>
            u._id === data.senderId
              ? {
                  ...u,
                  unreadCount: (u.unreadCount || 0) + 1,
                  lastMessageTime: new Date().toISOString(),
                }
              : u
          )
          .sort((a, b) =>
            (b.lastMessageTime || "").localeCompare(a.lastMessageTime || "")
          );

        setUsers(updated);
      } else {
        try {
          const res = await axios.get(`/api/chat/user/${data.senderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const newUser: ChatUser = {
            _id: res.data._id,
            name: res.data.name,
            unreadCount: 1,
            lastMessageTime: new Date().toISOString(),
          };

          setUsers((prev) => {
            const withoutDupes = prev.filter((u) => u._id !== newUser._id);
            return [newUser, ...withoutDupes].sort((a, b) =>
              (b.lastMessageTime || "").localeCompare(a.lastMessageTime || "")
            );
          });
        } catch (err) {
          console.error("❌ Failed to fetch sender info:", err);
        }
      }
    };

    socket.on("receive_message", handleMessage);
    return () => {
      socket.off("receive_message", handleMessage);
    };
  }, [users, userId, token]);

  const openChat = (user: ChatUser) => {
    navigate(`/chat/${user._id}`, { state: { name: user.name } });
  };

  const deleteConversation = async (userIdToDelete: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await axios.post(`/api/chat/clear/${userIdToDelete}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers((prev) => prev.filter((u) => u._id !== userIdToDelete));
    } catch (err) {
      alert("❌ Failed to delete conversation.");
    }
  };

  return (
    <div className="p-6 bg-black text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Conversations</h1>
      {users.length === 0 ? (
        <p className="text-center text-gray-400">No conversations yet.</p>
      ) : (
        <ul className="space-y-4">
          {users.map((user) => (
            <li
              key={user._id}
              className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg flex justify-between items-center"
            >
              <span className="cursor-pointer flex-1" onClick={() => openChat(user)}>
                Chat with: {user.name}
              </span>
              <div className="flex items-center gap-2">
                {user.unreadCount! > 0 && (
                  <span className="bg-red-600 text-white text-xs px-2 rounded-full">
                    {user.unreadCount}
                  </span>
                )}
                <button
                  onClick={() => deleteConversation(user._id)}
                  className="text-red-500 hover:text-red-300 text-lg"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatsPage;
