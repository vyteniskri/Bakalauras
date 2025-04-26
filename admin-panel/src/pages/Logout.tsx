import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Logout = ({ setIsAuthenticated }: { setIsAuthenticated: (value: boolean) => void }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const logoutUser = async () => {
      try {
        await api.post("/logout", {}, { withCredentials: true }); 
        localStorage.removeItem("accessToken"); 
        localStorage.removeItem("userId"); 
        localStorage.removeItem("Role"); 
        setIsAuthenticated(false); 
        navigate("/login"); 
      } catch (error) {
        console.error("Logout failed:", error);
        alert("Failed to log out. Please try again.");
      }
    };

    logoutUser();
  }, [navigate, setIsAuthenticated]);

  return <div></div>;
};

export default Logout;