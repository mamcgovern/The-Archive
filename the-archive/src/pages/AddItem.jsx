
import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ScanLine,
  Trash2,
} from "lucide-react";
import { useCollection } from "../contexts/CollectionContext";
import BarcodeScanner from "../components/BarcodeScanner";

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

function getYear(date) {
  if (!date) return "";

  const match = String(date).match(/\d{4}/);
  return match ? match[0] : "";
}

async function lookupGoogleBooks(isbn) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`
  );

  if (!response.ok) {
    throw new Error("Google Books lookup failed.");
  }

  const data = await response.json();
  const book = data.items?.[0]?.volumeInfo;

  if (!book) return null;

  const categories = book.categories || [];

  return {
    title: book.title || "",
    creator: book.authors?.join(", ") || "",
    year: getYear(book.publishedDate),
    publisher: book.publisher || "",
    description: book.description || "",
    cover: book.imageLinks?.thumbnail?.replace(/^http:/, "https:") || "",
    genre: categories[0]?.split("/").pop()?.trim() || "",
  };
}

async function lookupOpenLibrary(isbn) {
  const response = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`
  );

  if (!response.ok) {
    throw new Error("Open Library lookup failed.");
  }

  const data = await response.json();
  const book = data[`ISBN:${isbn}`];

  if (!book) return null;

  const subjects = book.subjects || [];

  const description =
    typeof book.description === "string"
      ? book.description
      : book.description?.value || "";

  return {
    title: book.title || "",
    creator: book.authors?.map((author) => author.name).join(", ") || "",
    year: getYear(book.publish_date),
    publisher:
      book.publishers?.map((publisher) => publisher.name).join(", ") || "",
    description,
    cover: book.cover?.large || book.cover?.medium || book.cover?.small || "",
    genre: subjects[0]?.name || subjects[0] || "",
  };
}

async function lookupBook(isbn) {
  try {
    const googleBook = await lookupGoogleBooks(isbn);

    if (googleBook) return googleBook;
  } catch (err) {
    console.warn("Google Books lookup unavailable:", err);
  }

  try {
    const openLibraryBook = await lookupOpenLibrary(isbn);

    if (openLibraryBook) return openLibraryBook;
  } catch (err) {
    console.warn("Open Library lookup unavailable:", err);
  }

  return null;
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
    });
  }, [editId, isEditing, items, loading]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
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
      };

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

      <form className="add-item-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step">01</span>
            <div>
              <h2>Find your book</h2>
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
                {lookingUp ? "Searching..." : "Look Up Book"}
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
            <span className="form-step">02</span>
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
