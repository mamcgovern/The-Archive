
import { Link } from "react-router-dom";
import {
  BookOpen,
  Headphones,
  Library,
  ArrowRight,
  Plus,
  Bookmark,
} from "lucide-react";
import { useCollection } from "../contexts/CollectionContext";
import { wishlistItems } from "../data/sampleData";

function Dashboard() {
  const { items, loading, error } = useCollection();

  if (loading) {
    return <div className="page-content">Loading your library...</div>;
  }

  if (error) {
    return <div className="page-content">{error}</div>;
  }

  const books = items.filter((item) => item.category === "Books");

  const recentlyAdded = [...books]
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    })
    .slice(0, 5);

  const physicalCopies = books.filter(
    (book) => book.format === "Physical Copy"
  ).length;

  const audiobooks = books.filter(
    (book) => book.format === "Audiobook"
  ).length;

  const genres = new Set(
    books.map((book) => book.genre?.trim()).filter(Boolean)
  );

  return (
    <div className="page-content">
      <section className="welcome-section">
        <div>
          <p className="eyebrow">YOUR SHARED BOOK LIBRARY</p>
          <h1>
            Welcome to <em>The Archive</em>
          </h1>
          <p>Every book you own, all in one place.</p>
        </div>
        <div className="welcome-decoration">
          <Library size={42} strokeWidth={1.2} />
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Books</span>
            <Library size={17} />
          </div>
          <div className="stat-value">{books.length}</div>
          <div className="stat-detail">In your shared collection</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Physical Copies</span>
            <BookOpen size={17} />
          </div>
          <div className="stat-value">{physicalCopies}</div>
          <div className="stat-detail">Books on your shelves</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Audiobooks</span>
            <Headphones size={17} />
          </div>
          <div className="stat-value">{audiobooks}</div>
          <div className="stat-detail">In your collection</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Wantlist</span>
            <Bookmark size={17} />
          </div>
          <div className="stat-value">{wishlistItems.length}</div>
          <div className="stat-detail">Books you want to find</div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR LIBRARY</p>
            <h2>Explore Your Collection</h2>
          </div>
          <Link to="/books" className="text-link">
            View collection <ArrowRight size={14} />
          </Link>
        </div>

        <div className="category-grid">
          <Link to="/books" className="category-card">
            <div className="category-icon">
              <BookOpen size={21} />
            </div>
            <div>
              <h3>All Books</h3>
              <p>{books.length} books in your collection</p>
            </div>
            <ArrowRight size={18} />
          </Link>
        </div>

        {genres.size > 0 && (
          <div className="genre-summary">
            <p className="eyebrow">YOUR GENRES</p>
            <div className="genre-list">
              {[...genres].sort().map((genre) => (
                <span className="genre-tag" key={genre}>
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">RECENTLY ADDED</p>
            <h2>Latest Additions</h2>
          </div>
          <Link to="/books" className="text-link">
            Browse library <ArrowRight size={14} />
          </Link>
        </div>

        {recentlyAdded.length === 0 ? (
          <div className="empty-collection">
            <BookOpen size={30} />
            <h3>Your collection is waiting</h3>
            <p>Add your first book to get started.</p>
            <Link to="/add" className="add-button">
              <Plus size={16} />
              Add a book
            </Link>
          </div>
        ) : (
          <div className="recent-list">
            {recentlyAdded.map((book) => (
              <div className="recent-item" key={book.id}>
                <div className="recent-thumb">
                  {book.cover ? (
                    <img src={book.cover} alt={`${book.title} cover`} />
                  ) : (
                    <BookOpen size={20} />
                  )}
                </div>

                <div className="recent-item-info">
                  <strong>{book.title}</strong>
                  <span>{book.creator || "Unknown author"}</span>
                  <div className="item-meta">
                    <span>{book.format || "Format not specified"}</span>
                    {book.genre && <span>{book.genre}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
