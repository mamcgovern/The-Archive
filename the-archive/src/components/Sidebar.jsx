
import { NavLink } from "react-router-dom";
import {
  Archive,
  LayoutDashboard,
  BookOpen,
  Clapperboard,
  Gamepad2,
  Dice5,
  BookMarked,
  Play,
  Heart,
} from "lucide-react";

const collectionLinks = [
  { label: "Books", path: "/books", icon: BookOpen },
  { label: "Movies & TV", path: "/movies", icon: Clapperboard },
  { label: "Video Games", path: "/video-games", icon: Gamepad2 },
  { label: "Board Games", path: "/board-games", icon: Dice5 },
];

const activityLinks = [
  { label: "Reading", path: "/activity/reading", icon: BookMarked },
  { label: "Watching", path: "/activity/watching", icon: Play },
  { label: "Playing", path: "/activity/playing", icon: Gamepad2 },
];

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
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">COLLECTION</div>
        <nav className="main-nav">
          {collectionLinks.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">YOUR ACTIVITY</div>
        <nav className="main-nav">
          {activityLinks.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">SAVED</div>
        <nav className="main-nav">
          <NavLink to="/wishlist" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Heart size={18} />
            <span>Wishlist</span>
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