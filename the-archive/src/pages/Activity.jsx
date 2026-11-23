
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BookOpen,
  Plus,
  X,
  Clock3,
  Star,
  Trash2,
  Save,
  CalendarDays,
  Pencil,
} from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../contexts/CollectionContext";

const HOUSEHOLD_ID = "maddie-nick";

const readingStatuses = [
  "Want to Read",
  "Currently Reading",
  "Finished",
  "DNF",
];

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Activity() {
  const { type } = useParams();
  const { user } = useAuth();
  const { items, loading: collectionLoading } = useCollection();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState("library");
  const [selectedBook, setSelectedBook] = useState("");
  const [borrowedTitle, setBorrowedTitle] = useState("");
  const [borrowedCreator, setBorrowedCreator] = useState("");
  const [borrowedFormat, setBorrowedFormat] = useState("Physical Copy");
  const [addStatus, setAddStatus] = useState("Want to Read");
  const [savingNew, setSavingNew] = useState(false);
  const [addError, setAddError] = useState("");
  const [drafts, setDrafts] = useState({});
  const [editingId, setEditingId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const books = useMemo(
    () => items.filter((item) => item.category === "Books"),
    [items]
  );

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const activityRef = collection(
      db,
      "households",
      HOUSEHOLD_ID,
      "activity"
    );

    const activityQuery = query(
      activityRef,
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      activityQuery,
      (snapshot) => {
        const records = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        records.sort((a, b) => {
          const aDate = a.updatedAt?.toMillis?.() || 0;
          const bDate = b.updatedAt?.toMillis?.() || 0;
          return bDate - aDate;
        });

        setEntries(records);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading reading activity:", err);
        setError("We couldn't load your reading activity.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  function getValues(entry) {
    return {
      ...entry,
      ...drafts[entry.id],
    };
  }

  function updateDraft(entryId, field, value) {
    setDrafts((current) => ({
      ...current,
      [entryId]: {
        ...current[entryId],
        [field]: value,
      },
    }));

    setSaveMessage("");
  }

  function handleEdit(entry) {
    setEditingId(entry.id);
    setSaveMessage("");
  }

  function handleCancelEdit(entryId) {
    setDrafts((current) => {
      const updated = { ...current };
      delete updated[entryId];
      return updated;
    });

    setEditingId("");
    setSaveMessage("");
  }

  function resetAddForm() {
    setAddType("library");
    setSelectedBook("");
    setBorrowedTitle("");
    setBorrowedCreator("");
    setBorrowedFormat("Physical Copy");
    setAddStatus("Want to Read");
    setAddError("");
  }

  async function handleAddEntry(event) {
    event.preventDefault();

    if (!user) return;

    let bookData;

    if (addType === "library") {
      if (!selectedBook) {
        setAddError("Choose a book first.");
        return;
      }

      const book = books.find((item) => item.id === selectedBook);

      if (!book) {
        setAddError("That book could not be found in your collection.");
        return;
      }

      bookData = {
        bookId: book.id,
        title: book.title || "",
        creator: book.creator || "",
        cover: book.cover || "",
        format: book.format || "Physical Copy",
        googleBooksRating:
          book.googleBooksRating ?? book.goodreadsRating ?? null,
        googleBooksRatingsCount:
          book.googleBooksRatingsCount ?? book.goodreadsRatingsCount ?? null,
        isBorrowed: false,
      };
    } else {
      if (!borrowedTitle.trim()) {
        setAddError("Enter the book title.");
        return;
      }

      bookData = {
        bookId: null,
        title: borrowedTitle.trim(),
        creator: borrowedCreator.trim(),
        cover: "",
        format: borrowedFormat,
        googleBooksRating: null,
        googleBooksRatingsCount: null,
        isBorrowed: true,
      };
    }

    setSavingNew(true);
    setAddError("");

    try {
      const activityRef = collection(
        db,
        "households",
        HOUSEHOLD_ID,
        "activity"
      );

      await addDoc(activityRef, {
        ...bookData,
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        status: addStatus,
        progressValue: 0,
        progressType: "percent",
        startDate: "",
        finishDate: "",
        personalRating: null,
        review: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      resetAddForm();
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding reading activity:", err);
      setAddError("We couldn't add this book. Please try again.");
    } finally {
      setSavingNew(false);
    }
  }

  async function handleSaveEntry(entry) {
    const values = getValues(entry);
    const progressValue = Number(values.progressValue);
    const personalRating =
      values.personalRating === "" || values.personalRating == null
        ? null
        : Number(values.personalRating);

    if (
      !Number.isFinite(progressValue) ||
      progressValue < 0 ||
      (values.progressType === "percent" && progressValue > 100)
    ) {
      setSaveMessage("Please enter a valid progress amount.");
      return;
    }

    if (
      personalRating !== null &&
      (!Number.isFinite(personalRating) ||
        personalRating < 1 ||
        personalRating > 5)
    ) {
      setSaveMessage("Your rating must be between 1 and 5.");
      return;
    }

    setSavingId(entry.id);
    setSaveMessage("");

    try {
      const entryRef = doc(
        db,
        "households",
        HOUSEHOLD_ID,
        "activity",
        entry.id
      );

      await updateDoc(entryRef, {
        status: values.status,
        progressValue,
        progressType: values.progressType,
        startDate: values.startDate || "",
        finishDate: values.finishDate || "",
        personalRating,
        review: values.review || "",
        updatedAt: serverTimestamp(),
      });

      setDrafts((current) => {
        const updated = { ...current };
        delete updated[entry.id];
        return updated;
      });

      setEditingId("");
      setSaveMessage("Changes saved.");
    } catch (err) {
      console.error("Error saving reading activity:", err);
      setSaveMessage("We couldn't save your changes. Please try again.");
    } finally {
      setSavingId("");
    }
  }

  async function handleDeleteEntry(entryId) {
    const confirmed = window.confirm(
      "Remove this reading record? This won't remove the book from your collection."
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(db, "households", HOUSEHOLD_ID, "activity", entryId)
      );

      setDrafts((current) => {
        const updated = { ...current };
        delete updated[entryId];
        return updated;
      });

      if (editingId === entryId) {
        setEditingId("");
      }
    } catch (err) {
      console.error("Error removing reading activity:", err);
      setSaveMessage("We couldn't remove this reading record.");
    }
  }

  if (type !== "reading") {
    return (
      <div className="empty-collection">
        <h2>Activity not found</h2>
        <p>Choose Reading from the sidebar.</p>
      </div>
    );
  }

  const currentlyReading = entries.filter(
    (entry) => entry.status === "Currently Reading"
  ).length;

  const finished = entries.filter(
    (entry) => entry.status === "Finished"
  ).length;

  return (
    <div className="activity-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR PERSONAL HISTORY</div>
          <h1>Reading</h1>
          <p>
            Keep track of what you're reading, have finished, and want to read.
          </p>
        </div>

        <div className="page-heading-icon">
          <BookOpen size={27} />
        </div>
      </div>

      <div className="reading-summary">
        <div className="reading-summary-card">
          <span>Currently reading</span>
          <strong>{currentlyReading}</strong>
        </div>

        <div className="reading-summary-card">
          <span>Books finished</span>
          <strong>{finished}</strong>
        </div>

        <div className="reading-summary-card">
          <span>Total records</span>
          <strong>{entries.length}</strong>
        </div>
      </div>

      <div className="reading-toolbar">
        <div>
          <h2>My Reading Activity</h2>
          <p>Only you can see and update your reading records.</p>
        </div>

        <button
          className="reading-add-button"
          onClick={() => {
            setShowAddForm((current) => !current);
            setAddError("");
          }}
        >
          {showAddForm ? <X size={17} /> : <Plus size={17} />}
          {showAddForm ? "Close" : "Add a Book"}
        </button>
      </div>

      {showAddForm && (
        <form className="reading-add-form" onSubmit={handleAddEntry}>
          <div>
            <h3>Add to your reading activity</h3>
            <p>
              Track a book from your library or one you're borrowing.
            </p>
          </div>

          <label>
            Where is this book from?
            <select
              value={addType}
              onChange={(event) => {
                setAddType(event.target.value);
                setAddError("");
              }}
            >
              <option value="library">Our household library</option>
              <option value="borrowed">Borrowed book</option>
            </select>
          </label>

          {addType === "library" ? (
            <>
              <label>
                Book
                <select
                  value={selectedBook}
                  onChange={(event) => setSelectedBook(event.target.value)}
                  required
                >
                  <option value="">Choose a book...</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} {book.creator ? `by ${book.creator}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              {books.length === 0 && !collectionLoading && (
                <p className="reading-form-message">
                  Your household library is empty. You can still add a
                  borrowed book by changing the selection above.
                </p>
              )}
            </>
          ) : (
            <>
              <label>
                Book title
                <input
                  type="text"
                  value={borrowedTitle}
                  onChange={(event) => setBorrowedTitle(event.target.value)}
                  placeholder="Enter the book title"
                  required
                />
              </label>

              <label>
                Author
                <input
                  type="text"
                  value={borrowedCreator}
                  onChange={(event) => setBorrowedCreator(event.target.value)}
                  placeholder="Enter the author"
                />
              </label>

              <label>
                Format
                <select
                  value={borrowedFormat}
                  onChange={(event) => setBorrowedFormat(event.target.value)}
                >
                  <option value="Physical Copy">Physical Copy</option>
                  <option value="Audiobook">Audiobook</option>
                </select>
              </label>

              <p className="reading-form-message">
                Borrowed books are only saved to your personal reading
                activity. They won't be added to your household library.
              </p>
            </>
          )}

          <label>
            Starting status
            <select
              value={addStatus}
              onChange={(event) => setAddStatus(event.target.value)}
            >
              {readingStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          {addError && (
            <p className="reading-form-error">{addError}</p>
          )}

          <button
            type="submit"
            className="reading-save-button"
            disabled={
              savingNew ||
              (addType === "library" &&
                (books.length === 0 || !selectedBook))
            }
          >
            {savingNew ? "Adding..." : "Add to My Reading"}
          </button>
        </form>
      )}

      {error && <p className="reading-form-error">{error}</p>}

      {saveMessage && (
        <p className="reading-save-message">{saveMessage}</p>
      )}

      {loading ? (
        <div className="empty-collection">
          <p>Loading your reading activity...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="reading-empty-state">
          <BookOpen size={34} />
          <h3>Your reading list is waiting</h3>
          <p>
            Add a book from your shared collection or track a borrowed book.
          </p>
          <button
            className="reading-add-button"
            onClick={() => setShowAddForm(true)}
          >
            <Plus size={17} />
            Add Your First Book
          </button>
        </div>
      ) : (
        <div className="reading-card-grid">
          {entries.map((entry) => {
            const values = getValues(entry);
            const isEditing = editingId === entry.id;
            const progressValue = Number(entry.progressValue) || 0;
            const progressType = entry.progressType || "percent";
            const progressPercent =
              progressType === "percent"
                ? Math.min(progressValue, 100)
                : 0;

            const communityRating =
              entry.googleBooksRating ?? entry.goodreadsRating;

            const communityRatingCount =
              entry.googleBooksRatingsCount ?? entry.goodreadsRatingsCount;

            return (
              <article
                className={`reading-entry-card ${isEditing ? "is-editing" : ""}`}
                key={entry.id}
              >
                <div className="reading-card-main">
                  <div className="reading-card-cover">
                    {entry.cover ? (
                      <img
                        src={entry.cover}
                        alt={`Cover of ${entry.title}`}
                      />
                    ) : (
                      <div className="reading-entry-cover-placeholder">
                        <BookOpen size={30} />
                      </div>
                    )}
                  </div>

                  <div className="reading-card-content">
                    <div className="reading-card-heading">
                      <div>
                        <h3>{entry.title}</h3>
                        <p>{entry.creator || "Author unknown"}</p>
                      </div>

                      <button
                        type="button"
                        className="reading-delete-button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        title="Remove reading record"
                        aria-label={`Remove ${entry.title} from reading activity`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="reading-card-tags">
                      <span className={`reading-status status-${(entry.status || "Want to Read").toLowerCase().replaceAll(" ", "-")}`}>
                        {entry.status || "Want to Read"}
                      </span>

                      <span className="reading-format-tag">
                        {entry.format || "Physical Copy"}
                      </span>

                      {entry.isBorrowed && (
                        <span className="reading-borrowed-label">
                          Borrowed
                        </span>
                      )}
                    </div>

                    {entry.status === "Currently Reading" && (
                      <div className="reading-card-progress">
                        <div className="reading-card-progress-label">
                          <span>Progress</span>
                          <strong>
                            {progressValue}
                            {progressType === "percent" ? "%" : " pages"}
                          </strong>
                        </div>

                        {progressType === "percent" && (
                          <div className="reading-progress-track">
                            <div
                              className="reading-progress-fill"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="reading-card-meta">
                      {entry.startDate && (
                        <span>
                          <CalendarDays size={13} />
                          Started {formatDate(entry.startDate)}
                        </span>
                      )}

                      {entry.finishDate && (
                        <span>
                          <CalendarDays size={13} />
                          Finished {formatDate(entry.finishDate)}
                        </span>
                      )}
                    </div>

                    <div className="reading-card-ratings">
                      {communityRating != null && (
                        <span>
                          <BookOpen size={14} />
                          Community: {Number(communityRating).toFixed(2)}/5
                          {communityRatingCount != null &&
                            ` (${Number(communityRatingCount).toLocaleString()} ratings)`}
                        </span>
                      )}

                      {entry.personalRating != null && (
                        <span className="reading-personal-rating">
                          <Star size={14} />
                          Your rating: {entry.personalRating}/5
                        </span>
                      )}
                    </div>

                    {entry.review && !isEditing && (
                      <p className="reading-card-review">
                        "{entry.review}"
                      </p>
                    )}

                    {!isEditing && (
                      <div className="reading-card-actions">
                        <button
                          type="button"
                          className="reading-edit-button"
                          onClick={() => handleEdit(entry)}
                        >
                          <Pencil size={15} />
                          Edit Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="reading-card-edit-panel">
                    <div className="reading-edit-heading">
                      <h4>Edit Reading Details</h4>
                      <button
                        type="button"
                        className="reading-cancel-button"
                        onClick={() => handleCancelEdit(entry.id)}
                      >
                        <X size={15} />
                        Cancel
                      </button>
                    </div>

                    <div className="reading-entry-fields">
                      <label>
                        Status
                        <select
                          value={values.status || "Want to Read"}
                          onChange={(event) =>
                            updateDraft(entry.id, "status", event.target.value)
                          }
                        >
                          {readingStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="reading-progress-fields">
                        <label>
                          Progress
                          <input
                            type="number"
                            min="0"
                            max={
                              values.progressType === "percent"
                                ? "100"
                                : undefined
                            }
                            step="1"
                            value={values.progressValue ?? 0}
                            onChange={(event) =>
                              updateDraft(
                                entry.id,
                                "progressValue",
                                event.target.value
                              )
                            }
                          />
                        </label>

                        <label>
                          Unit
                          <select
                            value={values.progressType || "percent"}
                            onChange={(event) =>
                              updateDraft(
                                entry.id,
                                "progressType",
                                event.target.value
                              )
                            }
                          >
                            <option value="percent">Percent</option>
                            <option value="pages">Pages</option>
                          </select>
                        </label>
                      </div>

                      <div className="reading-date-fields">
                        <label>
                          <CalendarDays size={14} />
                          Started
                          <input
                            type="date"
                            value={values.startDate || ""}
                            onChange={(event) =>
                              updateDraft(
                                entry.id,
                                "startDate",
                                event.target.value
                              )
                            }
                          />
                        </label>

                        <label>
                          <CalendarDays size={14} />
                          Finished
                          <input
                            type="date"
                            value={values.finishDate || ""}
                            onChange={(event) =>
                              updateDraft(
                                entry.id,
                                "finishDate",
                                event.target.value
                              )
                            }
                          />
                        </label>
                      </div>

                      <label>
                        Your rating (1–5)
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="0.5"
                          placeholder="Not rated"
                          value={values.personalRating ?? ""}
                          onChange={(event) =>
                            updateDraft(
                              entry.id,
                              "personalRating",
                              event.target.value
                            )
                          }
                        />
                      </label>

                      <label>
                        Your review
                        <textarea
                          rows="3"
                          placeholder="What did you think?"
                          value={values.review || ""}
                          onChange={(event) =>
                            updateDraft(
                              entry.id,
                              "review",
                              event.target.value
                            )
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      className="reading-save-button"
                      onClick={() => handleSaveEntry(entry)}
                      disabled={savingId === entry.id}
                    >
                      <Save size={15} />
                      {savingId === entry.id ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}

                {!isEditing && (
                  <div className="reading-entry-footer">
                    <span>
                      <Clock3 size={14} />
                      {entry.userName || "Your reading history"}
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Activity;
