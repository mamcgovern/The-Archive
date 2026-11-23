
import CollectionPage from "./CollectionPage";
import { useCollection } from "../contexts/CollectionContext";

function Books() {
  const { items, loading, error } = useCollection();

  const books = items.filter((item) => item.category === "Books");

  if (loading) {
    return <div className="page-content">Loading your books...</div>;
  }

  if (error) {
    return <div className="page-content">{error}</div>;
  }

  return (
    <CollectionPage
      title="Books"
      description="Your household's reading collection."
      items={books}
      filters={[
        "All",
        "Reading",
        "Finished",
        "Want to Read",
        "Paperback",
        "Hardcover",
        "Audiobook",
      ]}
    />
  );
}

export default Books;
