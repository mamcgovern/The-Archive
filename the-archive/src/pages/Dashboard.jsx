
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Bookmark,
  Coffee,
  Headphones,
  Library,
  Plus,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import { useCollection } from "../contexts/CollectionContext";
import { wishlistItems } from "../data/sampleData";

const HOUSEHOLD_ID = "maddie-nick";
const DEFAULT_READING_GOAL = 12;

function identifyReader(name = "") {
  const normalized = name.toLowerCase();

  if (/maddie|mattie|maddelynne/.test(normalized)) {
    return "maddie";
  }

  if (/nick|nicholas/.test(normalized)) {
    return "nick";
  }

  return null;
}

function getProgressPercent(value, goal) {
  if (!goal || goal <= 0) return 0;
  return Math.min((value / goal) * 100, 100);
}

function Dashboard() {
  const { user } = useAuth();
  const { items, loading, error } = useCollection();

  const [activity, setActivity] = useState([]);
  const [memberNames, setMemberNames] = useState({});
  const [memberGoals, setMemberGoals] = useState({
    maddie: DEFAULT_READING_GOAL,
    nick: DEFAULT_READING_GOAL,
  });
  const [goalDrafts, setGoalDrafts] = useState({});
  const [savingGoal, setSavingGoal] = useState({});
  const [goalMessages, setGoalMessages] = useState({});
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setActivity([]);
      setActivityLoading(false);
      return;
    }

    const activityRef = collection(
      db,
      "households",
      HOUSEHOLD_ID,
      "activity"
    );

    const membersRef = collection(
      db,
      "households",
      HOUSEHOLD_ID,
      "members"
    );

    const goalsRef = doc(
      db,
      "households",
      HOUSEHOLD_ID,
      "settings",
      "readingGoals"
    );

    const unsubscribeActivity = onSnapshot(
      activityRef,
      (snapshot) => {
        const records = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setActivity(records);
        setActivityLoading(false);
      },
      (err) => {
        console.error("Error loading household reading activity:", err);
        setActivityLoading(false);
      }
    );

    const unsubscribeMembers = onSnapshot(
      membersRef,
      (snapshot) => {
        const names = {};

        snapshot.docs.forEach((document) => {
          const data = document.data();

          names[document.id] =
            data.displayName ||
            data.name ||
            data.userName ||
            "";
        });

        setMemberNames(names);
      },
      (err) => {
        console.error("Error loading household members:", err);
      }
    );

    const unsubscribeGoals = onSnapshot(
      goalsRef,
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : {};

        const goals = {
          maddie: data.maddie || DEFAULT_READING_GOAL,
          nick: data.nick || DEFAULT_READING_GOAL,
        };

        setMemberGoals(goals);

        setGoalDrafts((previous) => ({
          maddie: previous.maddie ?? String(goals.maddie),
          nick: previous.nick ?? String(goals.nick),
        }));
      },
      (err) => {
        console.error("Error loading reading goals:", err);
      }
    );

    return () => {
      unsubscribeActivity();
      unsubscribeMembers();
      unsubscribeGoals();
    };
  }, [user]);

  const handleGoalChange = (reader, value) => {
    setGoalDrafts((previous) => ({
      ...previous,
      [reader]: value,
    }));

    setGoalMessages((previous) => ({
      ...previous,
      [reader]: "",
    }));
  };

  const saveReadingGoal = async (reader) => {
    const goal = Number(goalDrafts[reader]);

    if (
      !Number.isInteger(goal) ||
      goal < 1 ||
      goal > 365
    ) {
      setGoalMessages((previous) => ({
        ...previous,
        [reader]: "Enter a whole number between 1 and 365.",
      }));
      return;
    }

    setSavingGoal((previous) => ({
      ...previous,
      [reader]: true,
    }));

    setGoalMessages((previous) => ({
      ...previous,
      [reader]: "",
    }));

    try {
      const goalsRef = doc(
        db,
        "households",
        HOUSEHOLD_ID,
        "settings",
        "readingGoals"
      );

      const updatedGoals = {
        maddie:
          reader === "maddie"
            ? goal
            : memberGoals.maddie || DEFAULT_READING_GOAL,
        nick:
          reader === "nick"
            ? goal
            : memberGoals.nick || DEFAULT_READING_GOAL,
      };

      await setDoc(goalsRef, updatedGoals, { merge: true });

      setMemberGoals(updatedGoals);

      setGoalDrafts((previous) => ({
        ...previous,
        [reader]: String(goal),
      }));

      setGoalMessages((previous) => ({
        ...previous,
        [reader]: "Goal saved!",
      }));
    } catch (err) {
      console.error("Error saving reading goal:", err);

      setGoalMessages((previous) => ({
        ...previous,
        [reader]: "Couldn't save your goal. Try again.",
      }));
    } finally {
      setSavingGoal((previous) => ({
        ...previous,
        [reader]: false,
      }));
    }
  };

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

  const readingStats = useMemo(() => {
    const currentYear = new Date().getFullYear();

    const readers = {
      maddie: {
        name: "Maddie",
        finished: 0,
        averageRating: null,
        ratings: [],
        goal: memberGoals.maddie || DEFAULT_READING_GOAL,
      },
      nick: {
        name: "Nick",
        finished: 0,
        averageRating: null,
        ratings: [],
        goal: memberGoals.nick || DEFAULT_READING_GOAL,
      },
    };

    const getReader = (entry) => {
      const name =
        memberNames[entry.userId] ||
        entry.userName ||
        "";

      return identifyReader(name);
    };

    const finishedThisYear = activity.filter((entry) => {
      if (entry.status !== "Finished" || !entry.finishDate) {
        return false;
      }

      const finishDate = new Date(`${entry.finishDate}T00:00:00`);

      return (
        !Number.isNaN(finishDate.getTime()) &&
        finishDate.getFullYear() === currentYear
      );
    });

    const pagesLogged = activity.reduce((total, entry) => {
      if (entry.progressType !== "pages") return total;

      const pages = Number(entry.progressValue);

      return total + (Number.isFinite(pages) && pages > 0 ? pages : 0);
    }, 0);

    const ratedEntries = activity.filter((entry) => {
      const rating = Number(entry.personalRating);

      return (
        Number.isFinite(rating) &&
        rating >= 1 &&
        rating <= 5 &&
        entry.personalRating !== null &&
        entry.personalRating !== ""
      );
    });

    const averageRating =
      ratedEntries.length > 0
        ? ratedEntries.reduce(
            (total, entry) => total + Number(entry.personalRating),
            0
          ) / ratedEntries.length
        : null;

    finishedThisYear.forEach((entry) => {
      const reader = getReader(entry);

      if (reader) {
        readers[reader].finished += 1;
      }
    });

    ratedEntries.forEach((entry) => {
      const reader = getReader(entry);

      if (reader) {
        readers[reader].ratings.push(Number(entry.personalRating));
      }
    });

    Object.values(readers).forEach((reader) => {
      if (reader.ratings.length > 0) {
        reader.averageRating =
          reader.ratings.reduce((total, rating) => total + rating, 0) /
          reader.ratings.length;
      }
    });

    const householdGoal =
      readers.maddie.goal + readers.nick.goal;

    const householdProgress = finishedThisYear.length;

    const householdProgressPercent = getProgressPercent(
      householdProgress,
      householdGoal
    );

    return {
      currentYear,
      finishedThisYear: finishedThisYear.length,
      pagesLogged,
      averageRating,
      readers,
      householdGoal,
      householdProgress,
      householdProgressPercent,
    };
  }, [activity, memberNames, memberGoals]);

  if (loading) {
    return <div className="page-content">Loading your library...</div>;
  }

  if (error) {
    return <div className="page-content">{error}</div>;
  }

  return (
    <div className="page-content archive-dashboard">
      <section className="archive-welcome">
        <div className="archive-welcome-content">
          <div className="archive-brand-line">
            <span className="archive-brand-icon">
              <Coffee size={15} />
            </span>
            <span>THE ARCHIVE</span>
            <span className="archive-brand-divider">·</span>
            <span>BOOKS & BREWS</span>
          </div>

          <h1>
            Welcome to your
            <br />
            <em>little reading room.</em>
          </h1>

          <p>
            A cozy place for collected stories, favorite authors,
            and the occasional reread.
          </p>

          <div className="archive-welcome-actions">
            <Link to="/books" className="archive-primary-link">
              Explore the library
              <ArrowRight size={16} />
            </Link>
            <Link to="/add" className="archive-secondary-link">
              <Plus size={16} />
              Add a book
            </Link>
          </div>
        </div>

        <div className="archive-welcome-art">
          <div className="archive-art-circle">
            <Library size={76} strokeWidth={1} />
          </div>
          <div className="archive-art-caption">
            <span>EST. 2026</span>
            <span>A HOUSEHOLD LIBRARY</span>
          </div>
        </div>
      </section>

      <section className="archive-collection-overview">
        <div className="archive-section-heading">
          <div>
            <span className="archive-kicker">THE COLLECTION</span>
            <h2>Your shelves, at a glance</h2>
          </div>
          <Link to="/books" className="archive-text-link">
            Browse all books <ArrowRight size={14} />
          </Link>
        </div>

        <div className="archive-collection-stats">
          <div className="archive-collection-stat archive-total-stat">
            <div className="archive-stat-icon">
              <Library size={19} />
            </div>
            <div>
              <span>Total books</span>
              <strong>{books.length}</strong>
              <small>In your shared collection</small>
            </div>
          </div>

          <div className="archive-collection-stat">
            <div className="archive-stat-icon">
              <BookOpen size={19} />
            </div>
            <div>
              <span>Physical copies</span>
              <strong>{physicalCopies}</strong>
              <small>On your bookshelves</small>
            </div>
          </div>

          <div className="archive-collection-stat">
            <div className="archive-stat-icon">
              <Headphones size={19} />
            </div>
            <div>
              <span>Audiobooks</span>
              <strong>{audiobooks}</strong>
              <small>Ready to listen</small>
            </div>
          </div>

          <div className="archive-collection-stat">
            <div className="archive-stat-icon">
              <Bookmark size={19} />
            </div>
            <div>
              <span>Wantlist</span>
              <strong>{wishlistItems.length}</strong>
              <small>Stories to find</small>
            </div>
          </div>
        </div>
      </section>

      <section className="archive-reading-section">
        <div className="archive-section-heading">
          <div>
            <span className="archive-kicker">YOUR READING YEAR</span>
            <h2>A year in stories</h2>
            <p className="archive-section-subtitle">
              Every chapter counts. Here's how your year is unfolding.
            </p>
          </div>

          <Link to="/activity/reading" className="archive-text-link">
            Reading history <ArrowRight size={14} />
          </Link>
        </div>

        {activityLoading ? (
          <div className="archive-loading">
            <Coffee size={20} />
            <span>Brewing your reading statistics...</span>
          </div>
        ) : (
          <>
            <div className="archive-reading-hero">
              <div className="archive-reading-hero-main">
                <div className="archive-reading-label">
                  <BookMarked size={16} />
                  <span>THE HOUSEHOLD READING GOAL</span>
                </div>

                <div className="archive-reading-big-number">
                  {readingStats.finishedThisYear}
                  <span> / {readingStats.householdGoal}</span>
                </div>

                <h3>Books finished in {readingStats.currentYear}</h3>

                <p>
                  {readingStats.finishedThisYear >=
                  readingStats.householdGoal
                    ? "You've reached your household reading goal. Time to celebrate with another book."
                    : `${readingStats.householdGoal - readingStats.finishedThisYear} more ${
                        readingStats.householdGoal -
                          readingStats.finishedThisYear ===
                        1
                          ? "book"
                          : "books"
                      } to reach your household goal.`}
                </p>

                <div className="archive-goal-progress">
                  <div className="archive-goal-progress-track">
                    <div
                      className="archive-goal-progress-fill"
                      style={{
                        width: `${readingStats.householdProgressPercent}%`,
                      }}
                    />
                  </div>
                  <div className="archive-goal-progress-labels">
                    <span>
                      {Math.round(readingStats.householdProgressPercent)}%
                      complete
                    </span>
                    <span>
                      {readingStats.householdGoal} book goal
                    </span>
                  </div>
                </div>
              </div>

              <div className="archive-reading-hero-side">
                <div className="archive-reading-stamp">
                  <span>READ</span>
                  <strong>{readingStats.currentYear}</strong>
                  <span>REPEAT</span>
                  <BookOpen size={24} strokeWidth={1.3} />
                </div>
                <span className="archive-reading-stamp-caption">
                  GOOD BOOKS LIVE HERE
                </span>
              </div>
            </div>

            <div className="archive-insight-grid">
              <div className="archive-insight-card">
                <div className="archive-insight-top">
                  <span>Pages logged</span>
                  <TrendingUp size={18} />
                </div>
                <strong>
                  {readingStats.pagesLogged.toLocaleString()}
                </strong>
                <small>Across your reading records</small>
              </div>

              <div className="archive-insight-card">
                <div className="archive-insight-top">
                  <span>Average rating</span>
                  <Star size={18} />
                </div>
                <strong>
                  {readingStats.averageRating !== null
                    ? readingStats.averageRating.toFixed(1)
                    : "—"}
                  {readingStats.averageRating !== null && (
                    <span className="archive-insight-suffix"> / 5</span>
                  )}
                </strong>
                <small>Your combined personal ratings</small>
              </div>

              <div className="archive-insight-card">
                <div className="archive-insight-top">
                  <span>Reading records</span>
                  <BookOpen size={18} />
                </div>
                <strong>{activity.length}</strong>
                <small>Including rereads and borrowed books</small>
              </div>
            </div>

            <div className="archive-reading-club">
              <div className="archive-reading-club-heading">
                <div>
                  <span className="archive-kicker">THE READING ROOM</span>
                  <h3>Two readers, one library.</h3>
                </div>
                <Coffee size={22} />
              </div>

              <div className="archive-reader-grid">
                {Object.entries(readingStats.readers).map(([key, reader]) => {
                  const progress = getProgressPercent(
                    reader.finished,
                    reader.goal
                  );

                  return (
                    <div className="archive-reader-card" key={key}>
                      <div className="archive-reader-card-top">
                        <div className={`archive-reader-avatar ${key}`}>
                          {reader.name.charAt(0)}
                        </div>
                        <div>
                          <h4>{reader.name}</h4>
                          <span>Reader's card</span>
                        </div>
                        <Sparkles
                          size={17}
                          className="archive-reader-sparkle"
                        />
                      </div>

                      <div className="archive-reader-count">
                        <strong>{reader.finished}</strong>
                        <span>
                          of {reader.goal} books finished
                        </span>
                      </div>

                      <div className="archive-reader-progress-track">
                        <div
                          className={`archive-reader-progress-fill ${key}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="archive-reader-progress-labels">
                        <span>{Math.round(progress)}% of goal</span>
                        <span>{reader.goal} book goal</span>
                      </div>

                      <div className="archive-reader-rating">
                        <div>
                          <Star size={15} />
                          <span>Average rating</span>
                        </div>
                        <strong>
                          {reader.averageRating !== null
                            ? `${reader.averageRating.toFixed(1)} / 5`
                            : "Not rated yet"}
                        </strong>
                      </div>

                      <div className="archive-reader-footer">
                        {reader.ratings.length}{" "}
                        {reader.ratings.length === 1 ? "rating" : "ratings"}{" "}
                        recorded
                      </div>

                      <div className="archive-goal-editor">
                        <div className="archive-goal-editor-heading">
                          <Target size={16} />
                          <span>ANNUAL READING GOAL</span>
                        </div>

                        <div className="archive-goal-editor-controls">
                          <label>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              step="1"
                              value={goalDrafts[key] ?? reader.goal}
                              onChange={(event) =>
                                handleGoalChange(key, event.target.value)
                              }
                              aria-label={`${reader.name}'s annual reading goal`}
                            />
                            <span>books per year</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => saveReadingGoal(key)}
                            disabled={
                              savingGoal[key] ||
                              String(goalDrafts[key] ?? reader.goal) ===
                                String(reader.goal)
                            }
                          >
                            {savingGoal[key] ? "Saving..." : "Save goal"}
                          </button>
                        </div>

                        {goalMessages[key] && (
                          <p
                            className={`archive-goal-message ${
                              goalMessages[key] === "Goal saved!"
                                ? "success"
                                : "error"
                            }`}
                          >
                            {goalMessages[key]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="archive-reading-note">
                Set an individual goal for each reader. The household goal
                combines both targets. Completion counts use finish dates
                from {readingStats.currentYear}.
              </p>
            </div>
          </>
        )}
      </section>

      <section className="archive-library-section">
        <div className="archive-section-heading">
          <div>
            <span className="archive-kicker">EXPLORE THE STACKS</span>
            <h2>Find your next favorite</h2>
          </div>
          <Link to="/books" className="archive-text-link">
            View collection <ArrowRight size={14} />
          </Link>
        </div>

        <Link to="/books" className="archive-category-card">
          <div className="archive-category-icon">
            <BookOpen size={25} />
          </div>
          <div>
            <h3>The Book Collection</h3>
            <p>
              {books.length} books, all together on your shelves.
            </p>
          </div>
          <ArrowRight size={20} />
        </Link>

        {genres.size > 0 && (
          <div className="archive-genres">
            <span className="archive-kicker">
              A FEW OF YOUR FAVORITE GENRES
            </span>
            <div className="archive-genre-list">
              {[...genres].sort().map((genre) => (
                <span className="archive-genre-tag" key={genre}>
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="archive-recent-section">
        <div className="archive-section-heading">
          <div>
            <span className="archive-kicker">FRESH OFF THE SHELF</span>
            <h2>Recently added</h2>
          </div>
          <Link to="/books" className="archive-text-link">
            Browse library <ArrowRight size={14} />
          </Link>
        </div>

        {recentlyAdded.length === 0 ? (
          <div className="archive-empty">
            <BookOpen size={30} />
            <h3>Your shelves are waiting.</h3>
            <p>Add your first book to start building your collection.</p>
            <Link to="/add" className="archive-primary-link">
              <Plus size={16} />
              Add a book
            </Link>
          </div>
        ) : (
          <div className="archive-recent-grid">
            {recentlyAdded.map((book) => (
              <Link
                to="/books"
                className="archive-recent-card"
                key={book.id}
              >
                <div className="archive-recent-cover">
                  {book.cover ? (
                    <img src={book.cover} alt={`${book.title} cover`} />
                  ) : (
                    <BookOpen size={30} />
                  )}
                </div>

                <div className="archive-recent-info">
                  <strong>{book.title}</strong>
                  <span>{book.creator || "Unknown author"}</span>
                  <div>
                    <span>{book.format || "Format not specified"}</span>
                    {book.genre && <span>{book.genre}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="archive-dashboard-footer">
        <Coffee size={15} />
        <span>Good books. Good coffee. Good company.</span>
      </footer>
    </div>
  );
}

export default Dashboard;
