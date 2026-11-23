
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, Plus, ChevronRight } from "lucide-react";

function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const pageNames = {
    "/": "Dashboard",
    "/books": "Books",
    "/movies": "Movies & TV",
    "/video-games": "Video Games",
    "/board-games": "Board Games",
    "/activity/reading": "Reading",
    "/activity/watching": "Watching",
    "/activity/playing": "Playing",
    "/wishlist": "Wishlist",
  };

  const currentPage = pageNames[location.pathname] || "The Archive";

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>My Library</span>
        <ChevronRight size={15} />
        <strong>{currentPage}</strong>
      </div>

      <div className="topbar-actions">
        <label className="search-box">
          <Search size={17} />
          <input type="search" placeholder="Search your archive..." />
          <kbd>⌘ K</kbd>
        </label>

        <button className="icon-button" aria-label="Notifications">
          <Bell size={19} />
        </button>

        <button className="add-button" onClick={() => navigate("/add")}>
          <Plus size={17} />
          <span>Add item</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;