
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

const HOUSEHOLD_ID = "maddie-nick";
const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
const REFRESH_INTERVAL = 30 * 24 * 60 * 60 * 1000;

function getCatalogRef() {
  return collection(
    db,
    "households",
    HOUSEHOLD_ID,
    "bookCatalog"
  );
}

function cleanISBN(value = "") {
  return String(value).replace(/[\s-]/g, "").toUpperCase();
}

function getYear(date) {
  if (!date) return "";

  const match = String(date).match(/\d{4}/);
  return match ? match[0] : "";
}

function getISBN(identifiers = []) {
  const isbn13 = identifiers.find(
    (identifier) => identifier.type === "ISBN_13"
  );

  const isbn10 = identifiers.find(
    (identifier) => identifier.type === "ISBN_10"
  );

  return cleanISBN(
    isbn13?.identifier || isbn10?.identifier || ""
  );
}

function getDocumentId(book) {
  const isbn = cleanISBN(book.isbn);

  if (isbn) return isbn;

  if (book.googleBooksId) {
    return `google-${book.googleBooksId}`;
  }

  if (book.openLibraryId) {
    return `openlibrary-${String(book.openLibraryId)
      .replace(/^\/works\//, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  }

  return null;
}

function mapGoogleBook(item) {
  const book = item.volumeInfo || {};

  return {
    id: item.id,
    googleBooksId: item.id,
    source: "Google Books",
    title: book.title || "Untitled",
    creator: book.authors?.join(", ") || "",
    year: getYear(book.publishedDate),
    publisher: book.publisher || "",
    description: book.description || "",
    cover:
      book.imageLinks?.thumbnail?.replace(/^http:/, "https:") || "",
    genre: book.categories?.[0]?.split("/").pop()?.trim() || "",
    isbn: getISBN(book.industryIdentifiers),
    googleBooksRating: book.averageRating ?? null,
    googleBooksRatingsCount: book.ratingsCount ?? null,
  };
}

function mapOpenLibrarySearchBook(book) {
  return {
    id: book.key,
    openLibraryId: book.key,
    source: "Open Library",
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
    isbn: cleanISBN(book.isbn?.[0] || ""),
    googleBooksRating: null,
    googleBooksRatingsCount: null,
  };
}

function mapOpenLibraryISBNBook(book, isbn) {
  const subjects = book.subjects || [];

  const description =
    typeof book.description === "string"
      ? book.description
      : book.description?.value || "";

  return {
    id: book.key || isbn,
    openLibraryId: book.key || "",
    source: "Open Library",
    title: book.title || "",
    creator:
      book.authors?.map((author) => author.name).join(", ") || "",
    year: getYear(book.publish_date),
    publisher:
      book.publishers?.map((publisher) => publisher.name).join(", ") || "",
    description,
    cover:
      book.cover?.large ||
      book.cover?.medium ||
      book.cover?.small ||
      "",
    genre: subjects[0]?.name || subjects[0] || "",
    isbn,
    googleBooksRating: null,
    googleBooksRatingsCount: null,
  };
}

async function getGoogleBooksResults(query, maxResults = 20) {
  if (!GOOGLE_BOOKS_API_KEY) {
    throw new Error(
      "Google Books API key is missing. Check your .env.local file."
    );
  }

  const params = new URLSearchParams({
    q: query,
    key: GOOGLE_BOOKS_API_KEY,
    maxResults: String(maxResults),
  });

  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?${params.toString()}`
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(
      data.error?.message || "Google Books request failed."
    );
  }

  const data = await response.json();

  return (data.items || []).map(mapGoogleBook);
}

async function getOpenLibrarySearchResults(query) {
  const response = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`
  );

  if (!response.ok) {
    throw new Error("Open Library search failed.");
  }

  const data = await response.json();

  return (data.docs || []).map(mapOpenLibrarySearchBook);
}

async function getGoogleBookByISBN(isbn) {
  const results = await getGoogleBooksResults(`isbn:${isbn}`, 10);

  return (
    results.find((book) => book.googleBooksRating != null) ||
    results[0] ||
    null
  );
}

async function getOpenLibraryBookByISBN(isbn) {
  const response = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`
  );

  if (!response.ok) {
    throw new Error("Open Library ISBN lookup failed.");
  }

  const data = await response.json();
  const book = data[`ISBN:${isbn}`];

  return book ? mapOpenLibraryISBNBook(book, isbn) : null;
}

function isFresh(book) {
  const updatedAt = book.metadataUpdatedAt?.toDate?.();

  if (!updatedAt) return false;

  return Date.now() - updatedAt.getTime() < REFRESH_INTERVAL;
}

async function saveCatalogBook(book) {
  const documentId = getDocumentId(book);

  if (!documentId) return null;

  const bookRef = doc(getCatalogRef(), documentId);
  const existingSnapshot = await getDoc(bookRef);
  const existing = existingSnapshot.exists()
    ? existingSnapshot.data()
    : {};

  const savedBook = {
    title: book.title || existing.title || "Untitled",
    creator: book.creator || existing.creator || "",
    year: book.year || existing.year || "",
    publisher: book.publisher || existing.publisher || "",
    description: book.description || existing.description || "",
    cover: book.cover || existing.cover || "",
    genre: book.genre || existing.genre || "",
    isbn: cleanISBN(book.isbn || existing.isbn || ""),
    googleBooksId:
      book.googleBooksId || existing.googleBooksId || "",
    openLibraryId:
      book.openLibraryId || existing.openLibraryId || "",
    googleBooksRating:
      book.googleBooksRating ?? existing.googleBooksRating ?? null,
    googleBooksRatingsCount:
      book.googleBooksRatingsCount ??
      existing.googleBooksRatingsCount ??
      null,
    metadataSource: book.source || existing.metadataSource || "Manual",
    metadataUpdatedAt: serverTimestamp(),
  };

  await setDoc(bookRef, savedBook, { merge: true });

  return {
    ...savedBook,
    id: documentId,
  };
}

async function findCachedBooks(query) {
  const snapshot = await getDocs(getCatalogRef());
  const normalizedQuery = query.toLowerCase();

  return snapshot.docs
    .map((document) => ({
      id: document.id,
      ...document.data(),
    }))
    .filter((book) =>
      `${book.title || ""} ${book.creator || ""} ${book.isbn || ""}`
        .toLowerCase()
        .includes(normalizedQuery)
    )
    .slice(0, 20)
    .map((book) => ({
      ...book,
      source: book.metadataSource || "Firestore Catalog",
    }));
}

export async function searchBooks(query) {
  const cleanedQuery = query.trim();

  if (!cleanedQuery) return [];

  // Use the household catalog first to avoid unnecessary API requests.
  try {
    const cachedResults = await findCachedBooks(cleanedQuery);

    if (cachedResults.length > 0) {
      return cachedResults;
    }
  } catch (error) {
    console.warn("Could not search cached book catalog:", error);
  }

  // No local match, so search Google Books.
  try {
    const googleResults = await getGoogleBooksResults(cleanedQuery);

    if (googleResults.length > 0) {
      await Promise.all(
        googleResults.map((book) => saveCatalogBook(book))
      );

      return googleResults;
    }
  } catch (error) {
    console.warn("Google Books search unavailable:", error);
  }

  // Use Open Library if Google Books has no results.
  try {
    const openLibraryResults =
      await getOpenLibrarySearchResults(cleanedQuery);

    if (openLibraryResults.length > 0) {
      await Promise.all(
        openLibraryResults.map((book) => saveCatalogBook(book))
      );

      return openLibraryResults;
    }
  } catch (error) {
    console.warn("Open Library search unavailable:", error);
  }

  return [];
}

export async function lookupBook(isbnValue) {
  const isbn = cleanISBN(isbnValue);

  if (!isbn) return null;

  const isbnRef = doc(getCatalogRef(), isbn);

  try {
    const cachedSnapshot = await getDoc(isbnRef);

    if (cachedSnapshot.exists()) {
      const cachedBook = {
        id: cachedSnapshot.id,
        ...cachedSnapshot.data(),
      };

      if (isFresh(cachedBook)) {
        return cachedBook;
      }

      // Refresh older catalog entries.
      try {
        const refreshedBook = await getGoogleBookByISBN(isbn);

        if (refreshedBook) {
          return await saveCatalogBook({
            ...refreshedBook,
            isbn,
          });
        }
      } catch (error) {
        console.warn("Google Books refresh unavailable:", error);
      }

      // Keep the cached record if an external source is unavailable.
      return cachedBook;
    }
  } catch (error) {
    console.warn("Could not read cached book:", error);
  }

  // No cached record. Try Google Books first.
  try {
    const googleBook = await getGoogleBookByISBN(isbn);

    if (googleBook) {
      return await saveCatalogBook({
        ...googleBook,
        isbn,
      });
    }
  } catch (error) {
    console.warn("Google Books ISBN lookup unavailable:", error);
  }

  // Fall back to Open Library.
  try {
    const openLibraryBook = await getOpenLibraryBookByISBN(isbn);

    if (openLibraryBook) {
      return await saveCatalogBook(openLibraryBook);
    }
  } catch (error) {
    console.warn("Open Library ISBN lookup unavailable:", error);
  }

  return null;
}

export async function saveBookMetadata(book) {
  return saveCatalogBook(book);
}
