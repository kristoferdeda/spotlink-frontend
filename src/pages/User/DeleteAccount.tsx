import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://spotlink-backend.onrender.com/api";

const DeleteAccount = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete your account?")) return;

    try {
      await axios.delete(`${API_URL}/users/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password },
      });

      alert("✅ Account deleted successfully.");
      logout();
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "❌ Failed to delete account.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
      <h1 className="text-3xl mb-6 font-bold">Delete Account</h1>
      <p className="text-red-500 mb-4">⚠️ This action is irreversible.</p>
      <input
        type="password"
        placeholder="Enter your password to confirm"
        className="p-2 mb-4 bg-gray-800 text-white border border-gray-600 rounded w-full max-w-sm"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleDelete}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Delete My Account
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default DeleteAccount;
