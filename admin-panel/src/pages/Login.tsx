import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css"; 

const Login = ({ setIsAuthenticated }: { setIsAuthenticated: (value: boolean) => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const response = await api.post(
        "/login",
        { username, password },
        { withCredentials: true }
      );
  
      if (response.status === 200) {
        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        const payload = accessToken.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        const roles = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        const userId = decoded.sub;
  
  
        if ( Array.isArray(roles) ? roles.includes("Admin") || roles.includes("Moderator") : roles === "Admin" || roles === "Moderator") {
          localStorage.setItem("Role", roles);
          localStorage.setItem("userId", userId);
  
          if (userId) {
            setIsAuthenticated(true);
            navigate("/"); 
          }
        } else {
          alert("You do not have permission to access this application.");
          localStorage.removeItem("accessToken"); 
          localStorage.removeItem("userId"); 
          localStorage.removeItem("Role"); 
          setIsAuthenticated(false); 
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Invalid username or password.");
    }
  };

  return (
    <div style={{ justifyContent: "center", alignItems: "center", display: "flex", height: "80vh" }}>
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Please log in to access your account</p>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-login">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;