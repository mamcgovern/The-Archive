
import CollectionPage from "./CollectionPage";
import { useCollection } from "../contexts/CollectionContext";

function BoardGames() {
  const { items, loading, error } = useCollection();

  const games = items.filter(
    (item) => item.category === "Board Games"
  );

  if (loading) {
    return <div className="page-content">Loading your board games...</div>;
  }

  if (error) {
    return <div className="page-content">{error}</div>;
  }

  return (
    <CollectionPage
      title="Board Games"
      description="Your household's tabletop game collection."
      items={games}
      filters={[
        "All",
        "Owned",
        "Currently Playing",
        "Want to Play",
      ]}
    />
  );
}

export default BoardGames;
