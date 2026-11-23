
import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  Heart,
  Plus,
  Search,
  X,
  BookOpen,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";

const HOUSEHOLD_ID = "maddie-nick";

async function searchGoogleBooks(query) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`
  );

  if (!response.ok) {
    throw new Error("Google Books search failed.");
  }

  const data = await response.json();

  return (data.items || []).map((item) => {
    const book = item.volumeInfo || {};
    const identifiers = book.industryIdentifiers || [];

    const isbn13 = identifiers.find(
      (identifier) => identifier.type === "ISBN_13"
    );

    const isbn10 = identifiers.find(
      (identifier) => identifier.type === "ISBN_10"
    );

    return {
      id: item.id,
      title: book.title || "Untitled",
      creator: book.authors?.join(", ") || "",
      year: book.publishedDate?.match(/\d{4}/)?.[0] || "",
      publisher: book.publisher || "",
      description: book.description || "",
      cover:
        book.imageLinks?.thumbnail?.replace(/^http:/, "https:") || "",
      genre: book.categories?.[0]?.split("/").pop()?.trim() || "",
      isbn: isbn13?.identifier || isbn10?.identifier || "",
    };
  });
}

async function searchOpenLibrary(query) {
  const response = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`
  );

  if (!response.ok) {
    throw new Error("Open Library search failed.");
  }

  const data = await response.json();

  return (data.docs || []).map((book) => ({
    id: book.key,
    title: book.title || "Untitled",
    creator: book.author_name?.join(", ") || "",
    year: book.first_publish_year
      ? String(book.first_publish_year)
      : "",
    publisher: book.publisher?.[0] || "",
    description: "",
    cover: book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : "",
    genre: book.subject?.[0] || "",
    isbn: book.isbn?.[0] || "",
  }));
}

function Wishlist() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState("Physical Copy");

  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");

  const [processingId, setProcessingId] = useState(null);

  // Listen for changes to the shared household Wantlist.
  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const wishlistRef = collection(
      db,
      "households",
      HOUSEHOLD_ID,
      "wishlist"
    );

    const unsubscribe = onSnapshot(
      wishlistRef,
      (snapshot) => {
        const wishlistItems = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setItems(wishlistItems);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading Wantlist:", err);
        setError("We couldn't load your Wantlist.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const filteredItems = items
    .filter((item) =>
      `${item.title} ${item.creator} ${item.format}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);

      return dateB - dateA;
    });

  function openModal() {
    setShowModal(true);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedBook(null);
    setSelectedFormat("Physical Copy");
    setSearchMessage("");
    setError("");
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedBook(null);
    setSearchMessage("");
  }

  async function handleSearch(event) {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      setSearchMessage("Enter a book title or author's name.");
      return;
    }

    setSearching(true);
    setSearchResults([]);
    setSelectedBook(null);
    setSearchMessage("Searching for books...");

    try {
      let results = [];

      try {
        results = await searchGoogleBooks(query);
      } catch (err) {
        console.warn("Google Books search unavailable:", err);
      }

      if (results.length === 0) {
        try {
          results = await searchOpenLibrary(query);
        } catch (err) {
          console.warn("Open Library search unavailable:", err);
        }
      }

      setSearchResults(results);

      if (results.length === 0) {
        setSearchMessage(
          "No books found. Try another title or author's name."
        );
      } else {
        setSearchMessage(
          `Found ${results.length} ${results.length === 1 ? "book" : "books"}. Select the one you want.`
        );
      }
    } catch (err) {
      console.error("Wantlist search error:", err);
      setSearchMessage("Search is unavailable right now. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAddToWishlist() {
    if (!selectedBook || !user) return;

    setSaving(true);
    setError("");

    try {
      const wishlistRef = collection(
        db,
        "households",
        HOUSEHOLD_ID,
        "wishlist"
      );

      await addDoc(wishlistRef, {
        title: selectedBook.title,
        creator: selectedBook.creator,
        category: "Books",
        format: selectedFormat,
        year: selectedBook.year ? Number(selectedBook.year) : null,
        isbn: selectedBook.isbn || "",
        publisher: selectedBook.publisher || "",
        genre: selectedBook.genre || "",
        description: selectedBook.description || "",
        cover: selectedBook.cover || "",
        createdBy: user.uid,
        addedByName: user.displayName || user.email || "Household member",
        createdAt: serverTimestamp(),
      });

      closeModal();
    } catch (err) {
      console.error("Error adding to Wantlist:", err);
      setError("We couldn't add this book to your Wantlist.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(itemId) {
    const confirmed = window.confirm(
      "Remove this book from your Wantlist?"
    );

    if (!confirmed) return;

    setProcessingId(itemId);
    setError("");

    try {
      await deleteDoc(
        doc(
          db,
          "households",
          HOUSEHOLD_ID,
          "wishlist",
          itemId
        )
      );
    } catch (err) {
      console.error("Error removing Wantlist item:", err);
      setError("We couldn't remove this book. Please try again.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleMarkPurchased(item) {
    if (!user) return;

    const confirmed = window.confirm(
      `Add "${item.title}" to your shared collection and remove it from the Wantlist?`
    );

    if (!confirmed) return;

    setProcessingId(item.id);
    setError("");

    try {
      const collectionRef = collection(
        db,
        "households",
        HOUSEHOLD_ID,
        "collection"
      );

      const wishlistItemRef = doc(
        db,
        "households",
        HOUSEHOLD_ID,
        "wishlist",
        item.id
      );

      const newBookRef = doc(collectionRef);
      const batch = writeBatch(db);

      batch.set(newBookRef, {
        title: item.title || "",
        creator: item.creator || "",
        category: "Books",
        format: item.format || "Physical Copy",
        year: item.year || null,
        isbn: item.isbn || "",
        publisher: item.publisher || "",
        genre: item.genre || "",
        description: item.description || "",
        cover: item.cover || "",
        location: "",
        notes: "",
        status: "Owned",
        rating: null,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      batch.delete(wishlistItemRef);

      await batch.commit();
    } catch (err) {
      console.error("Error moving book to collection:", err);
      setError(
        "We couldn't move this book to your collection. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="wishlist-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SOMEDAY, SOON</div>
          <h1>Wantlist</h1>
          <p>All the books you'd love to bring home.</p>
        </div>

        <button className="add-button" onClick={openModal}>
          <Plus size={17} />
          Add to Wantlist
        </button>
      </div>

      <div className="collection-toolbar">
        <label className="collection-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search your Wantlist..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      <div className="collection-summary">
        <span>
          <strong>{filteredItems.length}</strong>{" "}
          {filteredItems.length === 1 ? "book wanted" : "books wanted"}
        </span>
        <span>Shared household Wantlist</span>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="empty-collection">
          Loading your Wantlist...
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="wishlist-grid">
          {filteredItems.map((item) => (
            <article className="wishlist-card" key={item.id}>
              <div className="wishlist-cover">
                {item.cover ? (
                  <img src={item.cover} alt={`${item.title} cover`} />
                ) : (
                  <BookOpen size={30} />
                )}

                {item.format && (
                  <span className="wishlist-format">
                    {item.format}
                  </span>
                )}
              </div>

              <div className="wishlist-card-info">
                <span className="wishlist-category">BOOK</span>
                <h3>{item.title}</h3>
                <p>{item.creator || "Author unknown"}</p>

                <div className="wishlist-owner">
                  Added by {item.addedByName || "a household member"}
                </div>

                <div className="wishlist-actions">
                  <button
                    type="button"
                    className="wishlist-purchased-button"
                    onClick={() => handleMarkPurchased(item)}
                    disabled={processingId === item.id}
                  >
                    <ShoppingBag size={15} />
                    {processingId === item.id
                      ? "Processing..."
                      : "Mark purchased"}
                  </button>

                  <button
                    type="button"
                    className="wishlist-remove-button"
                    onClick={() => handleRemove(item.id)}
                    disabled={processingId === item.id}
                    aria-label={`Remove ${item.title} from Wantlist`}
                    title="Remove from Wantlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-collection">
          <Heart size={28} />

          <h3>
            {search ? "No books found" : "Your Wantlist is empty"}
          </h3>

          <p>
            {search
              ? "Try another search."
              : "Add books you'd like to bring home. They'll show up here for both of you."}
          </p>

          {!search && (
            <button className="add-button" onClick={openModal}>
              <Plus size={17} />
              Add your first book
            </button>
          )}
        </div>
      )}

      {showModal && (
        <div
          className="wishlist-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="wishlist-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-modal-title"
          >
            <div className="wishlist-modal-header">
              <div>
                <p className="eyebrow">YOUR SHARED WANTLIST</p>
                <h2 id="wishlist-modal-title">Add a Book</h2>
                <p>Find the book you're hoping to bring home.</p>
              </div>

              <button
                type="button"
                className="wishlist-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form className="book-search-form" onSubmit={handleSearch}>
              <div className="book-search-input">
                <Search size={18} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by title or author..."
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="lookup-button"
                disabled={searching}
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </form>

            {searchMessage && (
              <p className="lookup-message" aria-live="polite">
                {searchMessage}
              </p>
            )}

            {searchResults.length > 0 && (
              <div className="wishlist-modal-results">
                {searchResults.map((book, index) => (
                  <button
                    type="button"
                    key={`${book.id}-${index}`}
                    className={`book-search-result ${
                      selectedBook?.id === book.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => setSelectedBook(book)}
                  >
                    <div className="book-search-cover">
                      {book.cover ? (
                        <img src={book.cover} alt={`${book.title} cover`} />
                      ) : (
                        <div className="book-search-cover-placeholder">
                          <BookOpen size={24} />
                        </div>
                      )}
                    </div>

                    <div className="book-search-result-info">
                      <strong>{book.title}</strong>
                      <span>{book.creator || "Author unknown"}</span>
                      <span>
                        {book.year || "Year unknown"}
                        {book.publisher ? ` · ${book.publisher}` : ""}
                      </span>
                    </div>

                    <span className="book-search-select">
                      {selectedBook?.id === book.id
                        ? "Selected"
                        : "Select"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedBook && (
              <div className="wishlist-selected-book">
                <div className="wishlist-selected-heading">
                  <strong>Selected book</strong>
                  <span>{selectedBook.title}</span>
                </div>

                <label htmlFor="wishlist-format">
                  Format you want
                </label>

                <select
                  id="wishlist-format"
                  value={selectedFormat}
                  onChange={(event) =>
                    setSelectedFormat(event.target.value)
                  }
                >
                  <option value="Physical Copy">Physical Copy</option>
                  <option value="Audiobook">Audiobook</option>
                </select>

                <button
                  type="button"
                  className="primary-button wishlist-save-button"
                  onClick={handleAddToWishlist}
                  disabled={saving}
                >
                  <Plus size={16} />
                  {saving ? "Adding..." : "Add to Wantlist"}
                </button>
              </div>
            )}

            {error && <p className="form-error">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Wishlist;
