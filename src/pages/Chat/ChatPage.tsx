import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import socket from "../../socket";
import axios from "axios";

interface Message {
  senderId: string;
  receiverId: string;
  message: string;
}

interface User {
  _id: string;
  name: string;
}

const ChatPage = () => {
  const { chatWithUserId } = useParams<{ chatWithUserId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatPartner, setChatPartner] = useState<User | null>(
    location.state?.name ? { _id: chatWithUserId!, name: location.state.name } : null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = localStorage.getItem("userId") || "";
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    if (!userId || !chatWithUserId) return;

    socket.emit("join_room", userId);

    if (!chatPartner) {
      axios
        .get(`/api/chat/user/${chatWithUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setChatPartner({ _id: res.data._id, name: res.data.name });
        })
        .catch((err) => {
          console.error("❌ Failed to fetch chat partner:", err);
        });
    }

    axios
      .get(`/api/chat/${chatWithUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const formattedMessages = res.data.messages.map((msg: any) => ({
          senderId: msg.sender,
          receiverId: msg.receiver,
          message: msg.message,
        }));
        setMessages(formattedMessages);
      })
      .catch((err) => {
        console.error("❌ Failed to load chat messages:", err);
      });

    socket.on("receive_message", (data: Message) => {
      const isCurrentChat =
        data.senderId === chatWithUserId || data.receiverId === chatWithUserId;
      if (isCurrentChat) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [chatWithUserId, userId, token, chatPartner]);

  const sendMessage = () => {
    if (!newMessage.trim() || !chatWithUserId) return;

    const messageData: Message = {
      senderId: userId,
      receiverId: chatWithUserId,
      message: newMessage,
    };

    socket.emit("send_message", messageData);
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");
  };

  const handleClearChat = async () => {
    if (!chatWithUserId || !confirm("Are you sure you want to clear this chat?")) return;

    try {
      await axios.post(`/api/chat/clear/${chatWithUserId}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
    } catch (err) {
      alert("❌ Failed to clear chat.");
      console.error(err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white text-black">
      <div className="bg-blue-600 text-white p-4 relative flex items-center justify-center">
        <button
          onClick={() => navigate("/chats")}
          className="absolute left-4 text-xl"
          title="Back to conversations"
        >
          ←
        </button>

        <h2 className="text-lg font-semibold text-center truncate max-w-xs">
          {chatPartner?.name || "User"}
        </h2>

        <button
          onClick={handleClearChat}
          className="absolute right-4 text-white text-lg hover:text-red-200"
          title="Clear Chat"
        >
          🗑️
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`my-2 ${msg.senderId === userId ? "text-right" : "text-left"}`}>
              <div
                className={`inline-block px-3 py-2 rounded-lg ${
                  msg.senderId === userId ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex p-4 border-t">
        <input
          type="text"
          className="flex-1 border p-2 rounded-l-md"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
