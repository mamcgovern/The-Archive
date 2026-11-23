
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
