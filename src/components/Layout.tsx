import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import FloatingChat from "../components/FloatingChat";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const dropdownStyle = {
    display: "block",
    padding: "10px 14px",
    width: "100%",
    textDecoration: "none",
    background: "white",
    color: "black",
    fontSize: "14px",
    cursor: "pointer",
    border: "none",
    textAlign: "left" as const,
  };

  return (
    <div className="bg-black min-h-screen flex flex-col relative">
      <nav className="bg-black text-white px-6 py-4 flex justify-between items-center relative z-50">
        
        <div className="flex items-center gap-4">
          <h1
            className="cursor-pointer text-3xl font-bold"
            onClick={() => navigate("/")}
          >
            SpotLink
          </h1>
        </div>

        <div className="hidden md:flex gap-6">
          <Link to="/" className="text-white font-bold hover:text-gray-300">HOME</Link>
          <Link to="/dashboard" className="text-white font-bold hover:text-gray-300">DASHBOARD</Link>
          <Link to="/parking" className="text-white font-bold hover:text-gray-300">PARKING</Link>
          <Link to="/booking-history" className="text-white font-bold hover:text-gray-300">BOOKINGS</Link>
          <Link to="/chats" className="text-white font-bold hover:text-gray-300">CHATS</Link>
        </div>

        <div className="flex items-center gap-4 ml-4">
          {user ? (
            <>
              <span>{user.parkPoints} PP</span>

              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="block md:hidden text-white focus:outline-none"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="text-white focus:outline-none"
                  title="User Menu"
                >
                  <FaUserCircle size={30} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "110%",
                    right: 0,
                    background: "white",
                    color: "black",
                    borderRadius: "6px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    zIndex: 999,
                    minWidth: "160px",
                  }}>
                    <Link to="/dashboard" onClick={() => setDropdownOpen(false)} style={dropdownStyle}>Dashboard</Link>
                    <Link to="/edit-profile" onClick={() => setDropdownOpen(false)} style={dropdownStyle}>Edit Info</Link>
                    <button
                      onClick={() => { setDropdownOpen(false); handleLogout(); }}
                      style={{ ...dropdownStyle, borderTop: "1px solid #ddd", background: "none" }}
                    >
                      Logout
                    </button>
                    <Link to="/delete-account" onClick={() => setDropdownOpen(false)} style={{ ...dropdownStyle, color: "red" }}>
                      Delete Account
                    </Link>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="hover:text-red-400 transition"
                title="Logout"
                style={{ background: "none", border: "none", cursor: "pointer", color: "white" }}
              >
                <FaSignOutAlt size={20} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="bg-white text-black font-semibold px-3 py-1 rounded hover:bg-gray-300 transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="bg-white text-black font-semibold px-3 py-1 rounded hover:bg-gray-300 transition"
              >
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-black flex flex-col gap-4 p-4 md:hidden z-40">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-white font-bold">HOME</Link>
          <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-white font-bold">DASHBOARD</Link>
          <Link to="/parking" onClick={() => setMobileMenuOpen(false)} className="text-white font-bold">PARKING</Link>
          <Link to="/booking-history" onClick={() => setMobileMenuOpen(false)} className="text-white font-bold">BOOKINGS</Link>
          <Link to="/chats" className="text-white font-bold hover:text-gray-300">CHATS</Link>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <FloatingChat />
    </div>
  );
};

export default Layout;
