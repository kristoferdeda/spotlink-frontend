import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://spotlink-backend.onrender.com/api";

interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    navigate: (path: string) => void
  ) => Promise<void>;
  logout: () => void;
  error: string | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
  
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      fetchUserProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);  
  

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/profile`);
      setUser(res.data);
    } catch (err) {
      console.error("❌ Error fetching profile");
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user.id);
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      setToken(res.data.token);
      await fetchUserProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    navigate: (path: string) => void
  ) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });
  
      alert(res.data.message || "✅ Registration successful! Please verify your email.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };  

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, login, register, logout, error, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
