
import { useState } from "react";
import {
  Archive,
  BookOpen,
  Clapperboard,
  Gamepad2,
  Dice5,
  LayoutDashboard,
  Search,
  Plus,
  Bell,
  ChevronRight,
  Clock3,
  Star,
  BookMarked,
  Play,
  MapPin,
  Heart,
  MoreHorizontal,
} from "lucide-react";
import "./App.css";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Books", icon: BookOpen },
  { label: "Movies & TV", icon: Clapperboard },
  { label: "Video Games", icon: Gamepad2 },
  { label: "Board Games", icon: Dice5 },
];

const stats = [
  { label: "Total collection", value: "248", detail: "Items in your archive", icon: Archive },
  { label: "Currently reading", value: "3", detail: "Across your household", icon: BookOpen },
  { label: "Currently watching", value: "2", detail: "Movies & TV", icon: Play },
  { label: "Wishlist", value: "18", detail: "Items to add someday", icon: Heart },
];

const recentItems = [
  {
    title: "The Seven Husbands of Evelyn Hugo",
    creator: "Taylor Jenkins Reid",
    category: "Book",
    year: "2017",
    cover: "https://covers.openlibrary.org/b/isbn/9781501161933-L.jpg",
    owner: "Maddie",
  },
  {
    title: "Interstellar",
    creator: "Christopher Nolan",
    category: "Movie",
    year: "2014",
    cover: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    owner: "Shared",
  },
  {
    title: "Mario Kart 8 Deluxe",
    creator: "Nintendo",
    category: "Video Game",
    year: "2017",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7d.jpg",
    owner: "Nick",
  },
  {
    title: "The Lord of the Rings",
    creator: "J.R.R. Tolkien",
    category: "Book",
    year: "1954",
    cover: "https://covers.openlibrary.org/b/isbn/9780544003415-L.jpg",
    owner: "Nick",
  },
];

const activity = [
  { name: "Maddie", action: "finished reading", item: "The Seven Husbands of Evelyn Hugo", time: "Yesterday", icon: BookOpen },
  { name: "Nick", action: "added to the collection", item: "Mario Kart 8 Deluxe", time: "2 days ago", icon: Plus },
  { name: "Maddie", action: "started watching", item: "The Office", time: "3 days ago", icon: Play },
];

const currentlyEnjoying = [
  { title: "Fourth Wing", creator: "Rebecca Yarros", person: "Maddie", progress: "62%", type: "Reading", icon: BookOpen },
  { title: "The Office", creator: "TV Series", person: "Maddie & Nick", progress: "Season 3", type: "Watching", icon: Play },
  { title: "Stardew Valley", creator: "ConcernedApe", person: "Nick", progress: "In progress", type: "Playing", icon: Gamepad2 },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");

  const filteredItems = recentItems.filter((item) =>
    `${item.title} ${item.creator} ${item.category}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Archive size={22} />
          </div>
          <div>
            <div className="brand-name">the archive</div>
            <div className="brand-caption">YOUR HOUSEHOLD LIBRARY</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">LIBRARY</div>
          <nav className="main-nav">
            {navigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className={`nav-item ${activePage === label ? "active" : ""}`}
                onClick={() => setActivePage(label)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{label}</span>
                {label === "Dashboard" && <span className="nav-dot" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">YOUR ACTIVITY</div>
          <nav className="main-nav">
            <button className="nav-item" onClick={() => setActivePage("Currently Reading")}>
              <BookMarked size={18} strokeWidth={1.8} />
              <span>Reading</span>
            </button>
            <button className="nav-item" onClick={() => setActivePage("Currently Watching")}>
              <Play size={18} strokeWidth={1.8} />
              <span>Watching</span>
            </button>
            <button className="nav-item" onClick={() => setActivePage("Currently Playing")}>
              <Gamepad2 size={18} strokeWidth={1.8} />
              <span>Playing</span>
            </button>
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
              <span>Household admin</span>
            </div>
            <MoreHorizontal size={19} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>My Library</span>
            <ChevronRight size={15} />
            <strong>{activePage}</strong>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search your archive..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
            </button>
            <button className="add-button" onClick={() => alert("We'll build the Add Item form next!")}>
              <Plus size={17} />
              <span>Add item</span>
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <div className="eyebrow">SUNDAY, NOVEMBER 22</div>
              <h1>Your world, <em>collected.</em></h1>
              <p>Everything you own, all in one place.</p>
            </div>
            <div className="welcome-decoration">
              <div className="decoration-circle">
                <Archive size={38} strokeWidth={1.2} />
              </div>
            </div>
          </section>

          <section className="stats-grid">
            {stats.map(({ label, value, detail, icon: Icon }) => (
              <div className="stat-card" key={label}>
                <div className="stat-top">
                  <span>{label}</span>
                  <Icon size={18} strokeWidth={1.6} />
                </div>
                <div className="stat-value">{value}</div>
                <div className="stat-detail">{detail}</div>
              </div>
            ))}
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div>
                <h2>Currently enjoying</h2>
              </div>
              <button className="text-link" onClick={() => setActivePage("Your Activity")}>
                View activity <ChevronRight size={16} />
              </button>
            </div>

            <div className="enjoying-grid">
              {currentlyEnjoying.map(({ title, creator, person, progress, type, icon: Icon }) => (
                <div className="enjoying-card" key={title}>
                  <div className="enjoying-icon">
                    <Icon size={21} strokeWidth={1.6} />
                  </div>
                  <div className="enjoying-type">{type.toUpperCase()}</div>
                  <h3>{title}</h3>
                  <p>{creator}</p>
                  <div className="progress-info">
                    <span>{person}</span>
                    <strong>{progress}</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: progress.includes("%") ? progress : "45%" }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="lower-grid">
            <section className="section-block collection-section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">FRESHLY CATALOGED</div>
                  <h2>Recently added</h2>
                </div>
                <button className="text-link" onClick={() => setActivePage("Collection")}>
                  View collection <ChevronRight size={16} />
                </button>
              </div>

              <div className="recent-list">
                {filteredItems.map((item) => (
                  <div className="recent-item" key={item.title}>
                    <img src={item.cover} alt={`${item.title} cover`} />
                    <div className="recent-item-info">
                      <strong>{item.title}</strong>
                      <span>{item.creator}</span>
                      <div className="item-meta">
                        <span>{item.category}</span>
                        <span>{item.year}</span>
                      </div>
                    </div>
                    <div className="owner-tag">{item.owner}</div>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <p className="empty-state">No items match your search.</p>
                )}
              </div>
            </section>

            <section className="section-block activity-section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">AROUND THE HOUSEHOLD</div>
                  <h2>Recent activity</h2>
                </div>
                <button className="more-button" aria-label="More activity">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div className="activity-list">
                {activity.map(({ name, action, item, time, icon: Icon }, index) => (
                  <div className="activity-item" key={index}>
                    <div className="activity-icon">
                      <Icon size={17} />
                    </div>
                    <div className="activity-copy">
                      <p><strong>{name}</strong> {action}</p>
                      <span>{item}</span>
                      <small><Clock3 size={12} /> {time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <footer className="dashboard-footer">
            <span>THE ARCHIVE</span>
            <span>A little home for everything you love.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
