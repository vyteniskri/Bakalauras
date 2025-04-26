import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Reports from "./pages/Reports";
import NavBar from "./components/Navbar";
import Login from "./pages/Login"; 
import { useEffect, useState } from "react";
import Logout from "./pages/Logout";
import History from "./pages/History";
import RemoveProfiles from "./pages/RemoveProfiles";
import ResetPassword from './pages/ResetPassword';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRoles, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const roles = localStorage.getItem("Role");

    if (roles) {
      let parsedRoles: string[] = [];
  
      try {
        parsedRoles = JSON.parse(roles);
      } catch (error) {
        parsedRoles = roles.split(",");
      }
  
      if (parsedRoles.includes("Admin")) {
        setUserRole("Admin"); 
      } else {
        setUserRole(null); 
      }
    }
    if (accessToken) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <Router>
      {isAuthenticated != null && isAuthenticated ? (
        <>
          <NavBar />
          <Routes>
            <Route path="/reset-password" element={<ResetPassword/>} />
            <Route path="/" element={<Reports />} />
            <Route path="/history" element={<History />} />
            <Route path="/logout" element={<Logout setIsAuthenticated={setIsAuthenticated} />} />
            {userRoles === "Admin" && (
              <Route path="/RemoveProfiles" element={<RemoveProfiles/>} 
              />
            )}
            
          </Routes>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;