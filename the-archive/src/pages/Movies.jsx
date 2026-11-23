
import CollectionPage from "./CollectionPage";
import { useCollection } from "../contexts/CollectionContext";

function Movies() {
  const { items, loading, error } = useCollection();

  const movies = items.filter(
    (item) => item.category === "Movies & TV"
  );

  if (loading) {
    return <div className="page-content">Loading your movies...</div>;
  }

  if (error) {
    return <div className="page-content">{error}</div>;
  }

  return (
    <CollectionPage
      title="Movies & TV"
      description="Your household's movie and television collection."
      items={movies}
      filters={[
        "All",
        "Watching",
        "Watched",
        "Want to Watch",
        "Blu-ray",
        "DVD",
        "4K",
      ]}
    />
  );
}

export default Movies;
