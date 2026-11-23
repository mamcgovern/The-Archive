
import { NavLink } from "react-router-dom";
import {
  Archive,
  LayoutDashboard,
  BookOpen,
  BookMarked,
  Heart,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand">
        <div className="brand-mark">
          <Archive size={22} />
        </div>
        <div>
          <div className="brand-name">the archive</div>
          <div className="brand-caption">YOUR HOUSEHOLD LIBRARY</div>
        </div>
      </NavLink>

      <div className="sidebar-section">
        <div className="sidebar-label">OVERVIEW</div>
        <nav className="main-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">LIBRARY</div>
        <nav className="main-nav">
          <NavLink
            to="/books"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <BookOpen size={18} />
            <span>My Collection</span>
          </NavLink>

          <NavLink
            to="/wishlist"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Heart size={18} />
            <span>Wantlist</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">YOUR ACTIVITY</div>
        <nav className="main-nav">
          <NavLink
            to="/activity/reading"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <BookMarked size={18} />
            <span>Reading</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="household-card">
          <div className="household-heading">YOUR HOUSEHOLD</div>
          <div className="household-members">
            <div className="avatar avatar-maddie">M</div>
            <div className="avatar avatar-nick">N</div>
            <div className="household-names">
              <strong>Maddie & Nick</strong>
              <span>2 members</span>
            </div>
          </div>
        </div>

        <div className="profile-row">
          <div className="profile-avatar">M</div>
          <div className="profile-info">
            <strong>Maddie</strong>
            <span>Household member</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
