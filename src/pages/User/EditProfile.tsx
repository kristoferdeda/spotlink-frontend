import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const EditProfile = () => {
  const { user, token, setUser } = useContext(AuthContext)!;
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `${API_URL}/users/profile`,
        { name, email, password },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(res.data.user);
      setMessage("✅ Profile updated!");
      setPassword("");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "❌ Update failed.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
      <form onSubmit={handleUpdate} className="w-full max-w-md space-y-4">
        <input
          type="text"
          placeholder="Name"
          className="p-2 w-full bg-gray-800 border border-gray-600 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="p-2 w-full bg-gray-800 border border-gray-600 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="New Password (optional)"
          className="p-2 w-full bg-gray-800 border border-gray-600 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold"
        >
          Save Changes
        </button>
        {message && <p className="text-sm mt-2 text-center text-yellow-400">{message}</p>}
        <button
          type="button"
          className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded mt-2"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
