import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./NavBar.css"; 

export default function Navbar() {
 const [userRoles, setUserRole] = useState<string | null>(null);
 
  useEffect(() => {
      const roles = localStorage.getItem("Role");
      setUserRole(roles);
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
  

    }, []);


  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="nav-link">
          Reports
        </Link>
        <Link to="/history" className="nav-link">
          History
        </Link>
        { userRoles === "Admin" && (
           <Link to="/RemoveProfiles" className="nav-link">
           Profiles
         </Link>
        )}
        <Link to="/logout" className="nav-link logout-link">
          Logout
        </Link>
      
      </div>
    </nav>
  );
}