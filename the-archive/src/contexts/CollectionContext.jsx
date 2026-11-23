
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthContext";

const CollectionContext = createContext(null);
const HOUSEHOLD_ID = "maddie-nick";

export function CollectionProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const collectionRef = collection(
      db,
      "households",
      HOUSEHOLD_ID,
      "collection"
    );

    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const firestoreItems = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setItems(firestoreItems);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading collection:", err);
        setError("We couldn't load your collection.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Retrieve cached book metadata using its ISBN.
  async function getBookMetadata(isbn) {
    if (!user) {
      throw new Error("You must be signed in to access the book catalog.");
    }

    const cleanISBN = String(isbn || "")
      .replace(/[\s-]/g, "")
      .toUpperCase();

    if (!cleanISBN) return null;

    const catalogRef = doc(
      db,
      "households",
      HOUSEHOLD_ID,
      "bookCatalog",
      cleanISBN
    );

    const snapshot = await getDoc(catalogRef);

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  }

  // Save or update book metadata in the shared catalog.
  async function saveBookMetadata(book) {
    if (!user) {
      throw new Error("You must be signed in to update the book catalog.");
    }

    const isbn = String(book.isbn || "")
      .replace(/[\s-]/g, "")
      .toUpperCase();

    const googleBooksId = book.googleBooksId || "";

    // Prefer ISBN as the catalog document ID.
    // Use the Google Books ID when an ISBN is unavailable.
    const catalogId = isbn || googleBooksId;

    if (!catalogId) {
      return null;
    }

    const catalogRef = doc(
      db,
      "households",
      HOUSEHOLD_ID,
      "bookCatalog",
      catalogId
    );

    const metadata = {
      title: book.title || "",
      creator: book.creator || "",
      isbn,
      publisher: book.publisher || "",
      year: book.year || "",
      description: book.description || "",
      cover: book.cover || "",
      genre: book.genre || "",
      googleBooksRating: book.googleBooksRating ?? null,
      googleBooksRatingsCount: book.googleBooksRatingsCount ?? null,
      googleBooksId,
      metadataSource: book.metadataSource || "Google Books",
      metadataUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(
      catalogRef,
      metadata,
      { merge: true }
    );

    return catalogId;
  }

  async function addItem(item) {
    if (!user) {
      throw new Error("You must be signed in to add an item.");
    }

    const collectionRef = collection(
      db,
      "households",
      HOUSEHOLD_ID,
      "collection"
    );

    const newItem = {
      ...item,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    };

    delete newItem.id;
    delete newItem.isUserAdded;

    const documentRef = await addDoc(collectionRef, newItem);
    return documentRef.id;
  }

  async function updateItem(itemId, updates) {
    const itemRef = doc(
      db,
      "households",
      HOUSEHOLD_ID,
      "collection",
      itemId
    );

    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async function removeItem(itemId) {
    const itemRef = doc(
      db,
      "households",
      HOUSEHOLD_ID,
      "collection",
      itemId
    );

    await deleteDoc(itemRef);
  }

  return (
    <CollectionContext.Provider
      value={{
        items,
        loading,
        error,
        addItem,
        updateItem,
        removeItem,
        getBookMetadata,
        saveBookMetadata,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  const context = useContext(CollectionContext);

  if (!context) {
    throw new Error(
      "useCollection must be used inside CollectionProvider"
    );
  }

  return context;
}
