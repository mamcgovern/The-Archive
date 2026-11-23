import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ScanLine,
  Trash2,
  BookOpen,
} from "lucide-react";
import { useCollection } from "../contexts/CollectionContext";
import BarcodeScanner from "../components/BarcodeScanner";
import {
  searchBooks,
  lookupBook,
  saveBookMetadata,
} from "../services/bookCatalog";

const initialForm = {
  title: "",
  creator: "",
  format: "Physical Copy",
  year: "",
  isbn: "",
  genre: "",
  publisher: "",
  description: "",
  location: "",
  cover: "",
  notes: "",
  googleBooksRating: "",
  googleBooksRatingsCount: "",
};

function cleanISBN(value) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function isValidISBN(value) {
  if (/^\d{13}$/.test(value)) {
    const digits = value.split("").map(Number);

    const sum = digits
      .slice(0, 12)
      .reduce((total, digit, index) => {
        return total + digit * (index % 2 === 0 ? 1 : 3);
      }, 0);

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[12];
  }

  if (/^\d{9}[\dX]$/.test(value)) {
    const digits = value.split("").map((character) =>
      character === "X" ? 10 : Number(character)
    );

    const sum = digits.reduce(
      (total, digit, index) => total + digit * (10 - index),
      0
    );

    return sum % 11 === 0;
  }

  return false;
}

function AddItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editId = searchParams.get("edit");
  const isEditing = Boolean(editId);

  const {
    items,
    loading,
    addItem,
    updateItem,
    removeItem,
  } = useCollection();

  const [form, setForm] = useState(initialForm);
  const [originalBook, setOriginalBook] = useState(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [lookupMessage, setLookupMessage] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState("");

  useEffect(() => {
    if (!isEditing || loading) return;

    const book = items.find((item) => item.id === editId);

    if (!book || book.category !== "Books") {
      setOriginalBook(null);
      setError("We couldn't find that book in your collection.");
      return;
    }

    setOriginalBook(book);
    setError("");

    setForm({
      title: book.title || "",
      creator: book.creator || "",
      format: book.format || "Physical Copy",
      year: book.year || "",
      isbn: book.isbn || "",
      genre: book.genre || "",
      publisher: book.publisher || "",
      description: book.description || "",
      location: book.location || "",
      cover: book.cover || "",
      notes: book.notes || "",
      googleBooksRating:
        book.googleBooksRating != null
          ? String(book.googleBooksRating)
          : book.goodreadsRating != null
            ? String(book.goodreadsRating)
            : "",
      googleBooksRatingsCount:
        book.googleBooksRatingsCount != null
          ? String(book.googleBooksRatingsCount)
          : book.goodreadsRatingsCount != null
            ? String(book.goodreadsRatingsCount)
            : "",
    });
  }, [editId, isEditing, items, loading]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
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
    setSearchMessage("Searching your catalog and book databases...");

    try {
      const results = await searchBooks(query);

      setSearchResults(results);

      if (results.length === 0) {
        setSearchMessage(
          "No books found. Try another search or enter the details manually."
        );
      } else {
        setSearchMessage(
          `Found ${results.length} ${results.length === 1 ? "result" : "results"}. Select a book to fill in its details.`
        );
      }
    } catch (err) {
      console.error("Book search error:", err);
      setSearchMessage(
        "Book search isn't available right now. You can enter the details manually."
      );
    } finally {
      setSearching(false);
    }
  }

  function selectSearchResult(book) {
    setForm((current) => ({
      ...current,
      title: book.title || current.title,
      creator: book.creator || current.creator,
      year: book.year || current.year,
      isbn: book.isbn ? cleanISBN(book.isbn) : current.isbn,
      publisher: book.publisher || current.publisher,
      description: book.description || current.description,
      cover: book.cover || current.cover,
      genre: book.genre || current.genre,
      googleBooksRating:
        book.googleBooksRating != null
          ? String(book.googleBooksRating)
          : current.googleBooksRating,
      googleBooksRatingsCount:
        book.googleBooksRatingsCount != null
          ? String(book.googleBooksRatingsCount)
          : current.googleBooksRatingsCount,
    }));

    setSearchResults([]);
    setSearchMessage(
      "Book selected! Review the details below before saving."
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleISBNLookup(isbnValue = form.isbn) {
    const isbn = cleanISBN(isbnValue);

    if (!isValidISBN(isbn)) {
      setLookupMessage("Enter a valid ISBN-10 or ISBN-13.");
      return;
    }

    setForm((current) => ({
      ...current,
      isbn,
    }));

    setLookingUp(true);
    setLookupMessage("Looking up book information...");

    try {
      const book = await lookupBook(isbn);

      if (!book) {
        setLookupMessage(
          "We couldn't find that ISBN. You can still enter the book details manually."
        );
        return;
      }

      setForm((current) => ({
        ...current,
        isbn,
        title: book.title || current.title,
        creator: book.creator || current.creator,
        year: book.year || current.year,
        publisher: book.publisher || current.publisher,
        description: book.description || current.description,
        cover: book.cover || current.cover,
        genre: book.genre || current.genre,
        googleBooksRating:
          book.googleBooksRating != null
            ? String(book.googleBooksRating)
            : current.googleBooksRating,
        googleBooksRatingsCount:
          book.googleBooksRatingsCount != null
            ? String(book.googleBooksRatingsCount)
            : current.googleBooksRatingsCount,
      }));

      setLookupMessage(
        "Book information found! Review the details before saving."
      );
    } catch (err) {
      console.error("Book lookup error:", err);

      setLookupMessage(
        "The book lookup isn't available right now. You can enter the details manually."
      );
    } finally {
      setLookingUp(false);
    }
  }

  function handleScannedISBN(isbn) {
    setShowScanner(false);

    setForm((current) => ({
      ...current,
      isbn,
    }));

    handleISBNLookup(isbn);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Please enter a book title.");
      return;
    }

    const isbn = cleanISBN(form.isbn);

    if (isbn && !isValidISBN(isbn)) {
      setError(
        "Please enter a valid ISBN-10 or ISBN-13, or clear the ISBN field."
      );
      return;
    }

    const googleBooksRating = form.googleBooksRating.trim();
    const googleBooksRatingsCount = form.googleBooksRatingsCount.trim();

    if (
      googleBooksRating !== "" &&
      (!Number.isFinite(Number(googleBooksRating)) ||
        Number(googleBooksRating) < 0 ||
        Number(googleBooksRating) > 5)
    ) {
      setError("Community ratings must be between 0 and 5.");
      return;
    }

    if (
      googleBooksRatingsCount !== "" &&
      (!Number.isInteger(Number(googleBooksRatingsCount)) ||
        Number(googleBooksRatingsCount) < 0)
    ) {
      setError("Ratings count must be a whole number.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const bookDetails = {
        title: form.title.trim(),
        creator: form.creator.trim(),
        category: "Books",
        format: form.format,
        year: form.year ? Number(form.year) : null,
        isbn,
        genre: form.genre.trim(),
        publisher: form.publisher.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        cover: form.cover.trim(),
        notes: form.notes.trim(),
        googleBooksRating:
          googleBooksRating !== "" ? Number(googleBooksRating) : null,
        googleBooksRatingsCount:
          googleBooksRatingsCount !== ""
            ? Number(googleBooksRatingsCount)
            : null,
      };

      await saveBookMetadata({
        ...bookDetails,
        source: "Manual",
      });

      if (isEditing) {
        await updateItem(editId, {
          ...bookDetails,
          status: originalBook?.status || "Owned",
          rating: originalBook?.rating ?? null,
        });
      } else {
        await addItem({
          ...bookDetails,
          status: "Owned",
          rating: null,
        });
      }

      navigate("/books");
    } catch (err) {
      console.error("Error saving book:", err);
      setError("We couldn't save your book. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${form.title}" from your collection? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setDeleting(true);

    try {
      await removeItem(editId);
      navigate("/books");
    } catch (err) {
      console.error("Error deleting book:", err);
      setError("We couldn't delete this book. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  if (isEditing && loading) {
    return (
      <div className="page-content">
        Loading book information...
      </div>
    );
  }

  if (isEditing && !originalBook && !error) {
    return (
      <div className="page-content">
        Loading book information...
      </div>
    );
  }

  return (
    <div className="page-content">
      <Link to="/books" className="back-link">
        <ArrowLeft size={16} />
        Back to books
      </Link>

      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR COLLECTION</p>
          <h1>{isEditing ? "Edit Book" : "Add a Book"}</h1>
          <p>
            {isEditing
              ? "Update the details of this book in your household library."
              : "Add a book to your shared household library."}
          </p>
        </div>
      </div>

      {!isEditing && (
        <section className="form-section book-search-section">
          <div className="form-section-heading">
            <span className="form-step">01</span>
            <div>
              <h2>Search for a book</h2>
              <p>
                Search by title or author to find a book and automatically
                fill in its information.
              </p>
            </div>
          </div>

          <form className="book-search-form" onSubmit={handleSearch}>
            <div className="book-search-input">
              <Search size={18} />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by title or author..."
                aria-label="Search books by title or author"
              />
            </div>

            <button
              type="submit"
              className="lookup-button"
              disabled={searching}
            >
              <Search size={16} />
              {searching ? "Searching..." : "Search Books"}
            </button>
          </form>

          {searchMessage && (
            <p className="lookup-message" aria-live="polite">
              {searchMessage}
            </p>
          )}

          {searchResults.length > 0 && (
            <div className="book-search-results">
              {searchResults.map((book, index) => (
                <button
                  type="button"
                  className="book-search-result"
                  key={`${book.source}-${book.id}-${index}`}
                  onClick={() => selectSearchResult(book)}
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
                    {book.isbn && (
                      <span className="book-search-isbn">
                        ISBN: {book.isbn}
                      </span>
                    )}
                    {book.googleBooksRating != null && (
                      <span>
                        Community rating: {book.googleBooksRating}/5
                        {book.googleBooksRatingsCount != null &&
                          ` · ${Number(book.googleBooksRatingsCount).toLocaleString()} ratings`}
                      </span>
                    )}
                  </div>

                  <span className="book-search-select">
                    Select
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <form className="add-item-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step">{isEditing ? "01" : "02"}</span>
            <div>
              <h2>Find your book by ISBN</h2>
              <p>
                Enter the ISBN or scan the barcode to automatically fill in
                the book details.
              </p>
            </div>
          </div>

          <div className="isbn-lookup">
            <label htmlFor="isbn">ISBN-10 or ISBN-13</label>

            <div className="isbn-input-row">
              <input
                id="isbn"
                name="isbn"
                value={form.isbn}
                onChange={handleChange}
                placeholder="e.g. 9781649374042"
              />

              <button
                type="button"
                className="lookup-button"
                onClick={() => handleISBNLookup()}
                disabled={lookingUp}
              >
                <Search size={16} />
                {lookingUp ? "Searching..." : "Look Up ISBN"}
              </button>

              <button
                type="button"
                className="scan-button"
                onClick={() => setShowScanner(true)}
              >
                <ScanLine size={17} />
                Scan
              </button>
            </div>

            {lookupMessage && (
              <p className="lookup-message" aria-live="polite">
                {lookupMessage}
              </p>
            )}
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step">{isEditing ? "02" : "03"}</span>
            <div>
              <h2>Book details</h2>
              <p>Review the information and make any changes.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field full-width">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter the book title"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="creator">Author</label>
              <input
                id="creator"
                name="creator"
                value={form.creator}
                onChange={handleChange}
                placeholder="Enter the author"
              />
            </div>

            <div className="form-field">
              <label htmlFor="year">Publication Year</label>
              <input
                id="year"
                name="year"
                type="number"
                min="0"
                max="2100"
                value={form.year}
                onChange={handleChange}
                placeholder="e.g. 2024"
              />
            </div>

            <div className="form-field">
              <label htmlFor="genre">Primary Genre</label>
              <input
                id="genre"
                name="genre"
                value={form.genre}
                onChange={handleChange}
                placeholder="e.g. Fantasy"
                list="book-genres"
              />

              <datalist id="book-genres">
                <option value="Fantasy" />
                <option value="Romance" />
                <option value="Mystery" />
                <option value="Thriller" />
                <option value="Science Fiction" />
                <option value="Horror" />
                <option value="Historical Fiction" />
                <option value="Contemporary Fiction" />
                <option value="Literary Fiction" />
                <option value="Young Adult" />
                <option value="Nonfiction" />
                <option value="Biography" />
                <option value="Memoir" />
                <option value="Self-Help" />
                <option value="History" />
                <option value="Poetry" />
                <option value="Children's" />
              </datalist>
            </div>

            <div className="form-field">
              <label htmlFor="publisher">Publisher</label>
              <input
                id="publisher"
                name="publisher"
                value={form.publisher}
                onChange={handleChange}
                placeholder="Publisher name"
              />
            </div>

            <div className="form-field">
              <label htmlFor="format">Format</label>
              <select
                id="format"
                name="format"
                value={form.format}
                onChange={handleChange}
              >
                <option value="Physical Copy">Physical Copy</option>
                <option value="Audiobook">Audiobook</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="location">Storage Location</label>
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Living room bookshelf"
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="cover">Cover Image URL</label>
              <input
                id="cover"
                name="cover"
                type="url"
                value={form.cover}
                onChange={handleChange}
                placeholder="Paste an image URL"
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Book description"
                rows="3"
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Anything else you want to remember?"
                rows="4"
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step">{isEditing ? "03" : "04"}</span>
            <div>
              <h2>Community Rating</h2>
              <p>
                Google Books ratings are filled in automatically when
                available. You can also enter or change them manually.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="googleBooksRating">
                Community Rating
              </label>
              <input
                id="googleBooksRating"
                name="googleBooksRating"
                type="number"
                min="0"
                max="5"
                step="0.01"
                value={form.googleBooksRating}
                onChange={handleChange}
                placeholder="e.g. 4.32"
              />
              <small>Average rating out of 5</small>
            </div>

            <div className="form-field">
              <label htmlFor="googleBooksRatingsCount">
                Number of Ratings
              </label>
              <input
                id="googleBooksRatingsCount"
                name="googleBooksRatingsCount"
                type="number"
                min="0"
                step="1"
                value={form.googleBooksRatingsCount}
                onChange={handleChange}
                placeholder="e.g. 125000"
              />
              <small>Total number of community ratings</small>
            </div>
          </div>
        </section>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          {isEditing && (
            <button
              type="button"
              className="delete-button"
              onClick={handleDelete}
              disabled={deleting || submitting}
            >
              <Trash2 size={16} />
              {deleting ? "Deleting..." : "Delete Book"}
            </button>
          )}

          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate("/books")}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting || lookingUp || deleting}
          >
            {submitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Add to Collection"}
          </button>
        </div>
      </form>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScannedISBN}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

export default AddItem;