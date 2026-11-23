
import { Link } from "react-router-dom";
import {
  Archive,
  BookOpen,
  Clapperboard,
  Gamepad2,
  Dice5,
  Heart,
  Play,
  Clock3,
  ChevronRight,
  Plus,
} from "lucide-react";
import { collectionItems, wishlistItems, recentActivity } from "../data/sampleData";

const categoryLinks = [
  { title: "Books", count: "books", icon: BookOpen, path: "/books" },
  { title: "Movies & TV", count: "movies", icon: Clapperboard, path: "/movies" },
  { title: "Video Games", count: "games", icon: Gamepad2, path: "/video-games" },
  { title: "Board Games", count: "boardGames", icon: Dice5, path: "/board-games" },
];

const currentlyEnjoying = [
  { title: "Fourth Wing", creator: "Rebecca Yarros", person: "Maddie", progress: 62, type: "Reading", icon: BookOpen },
  { title: "The Office", creator: "TV Series", person: "Maddie & Nick", progress: 45, type: "Watching", icon: Play },
  { title: "Stardew Valley", creator: "ConcernedApe", person: "Nick", progress: 75, type: "Playing", icon: Gamepad2 },
];

function Dashboard() {
  const totalItems = collectionItems.length;
  const books = collectionItems.filter((item) => item.category === "Books").length;
  const movies = collectionItems.filter((item) => item.category === "Movies & TV").length;
  const games = collectionItems.filter((item) => item.category === "Video Games").length;
  const boardGames = collectionItems.filter((item) => item.category === "Board Games").length;

  const stats = [
    { label: "Total collection", value: totalItems, detail: "Items in your archive", icon: Archive },
    { label: "Books", value: books, detail: "In your library", icon: BookOpen },
    { label: "Movies & TV", value: movies, detail: "On your shelves", icon: Clapperboard },
    { label: "Wishlist", value: wishlistItems.length, detail: "Things to find", icon: Heart },
  ];

  return (
    <div className="dashboard">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">YOUR HOUSEHOLD LIBRARY</div>
          <h1>Your world, <em>collected.</em></h1>
          <p>Everything you own, all in one place.</p>
        </div>
        <div className="welcome-decoration">
          <Archive size={42} strokeWidth={1.2} />
        </div>
      </section>

      <section className="stats-grid">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-detail">{detail}</div>
          </div>
        ))}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <div className="eyebrow">EXPLORE YOUR SHELVES</div>
            <h2>Your collection</h2>
          </div>
        </div>

        <div className="category-grid">
          {categoryLinks.map(({ title, count, icon: Icon, path }) => (
            <Link to={path} className="category-card" key={title}>
              <div className="category-icon"><Icon size={22} /></div>
              <div>
                <h3>{title}</h3>
                <p>{count === "books" ? books : count === "movies" ? movies : count === "games" ? games : boardGames} items</p>
              </div>
              <ChevronRight size={17} />
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div>
            <h2>Currently enjoying</h2>
          </div>
          <Link to="/activity/reading" className="text-link">
            View activity <ChevronRight size={16} />
          </Link>
        </div>

        <div className="enjoying-grid">
          {currentlyEnjoying.map(({ title, creator, person, progress, type, icon: Icon }) => (
            <div className="enjoying-card" key={title}>
              <div className="enjoying-icon"><Icon size={21} /></div>
              <div className="enjoying-type">{type.toUpperCase()}</div>
              <h3>{title}</h3>
              <p>{creator}</p>
              <div className="progress-info">
                <span>{person}</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="lower-grid">
        <section className="section-block">
          <div className="section-heading">
            <div>
              <div className="eyebrow">FRESHLY CATALOGED</div>
              <h2>Recently added</h2>
            </div>
            <Link to="/books" className="text-link">
              View collection <ChevronRight size={16} />
            </Link>
          </div>

          <div className="recent-list">
            {[...collectionItems].slice(0, 4).map((item) => (
              <div className="recent-item" key={item.id}>
                <div className="recent-thumb">
                  {item.cover ? <img src={item.cover} alt="" /> : <Archive size={20} />}
                </div>
                <div className="recent-item-info">
                  <strong>{item.title}</strong>
                  <span>{item.creator}</span>
                  <div className="item-meta">
                    <span>{item.category}</span>
                    <span>{item.year}</span>
                  </div>
                </div>
                <span className="owner-tag">{item.owner}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <div className="eyebrow">AROUND THE HOUSEHOLD</div>
              <h2>Recent activity</h2>
            </div>
          </div>

          <div className="activity-list">
            {recentActivity.map((entry) => (
              <div className="activity-item" key={entry.id}>
                <div className="activity-icon"><Clock3 size={17} /></div>
                <div className="activity-copy">
                  <p><strong>{entry.person}</strong> {entry.action}</p>
                  <span>{entry.item}</span>
                  <small>{entry.time}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-footer">
        <span>THE ARCHIVE</span>
        <span>A little home for everything you love.</span>
      </div>
    </div>
  );
}

export default Dashboard;
