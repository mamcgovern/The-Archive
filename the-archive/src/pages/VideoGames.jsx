
import CollectionPage from "./CollectionPage";
import { useCollection } from "../contexts/CollectionContext";

function VideoGames() {
  const { items, loading, error } = useCollection();

  const games = items.filter(
    (item) => item.category === "Video Games"
  );

  if (loading) {
    return <div className="page-content">Loading your games...</div>;
  }

  if (error) {
    return <div className="page-content">{error}</div>;
  }

  return (
    <CollectionPage
      title="Video Games"
      description="Your household's video game collection."
      items={games}
      filters={[
        "All",
        "Playing",
        "Completed",
        "Backlog",
        "Nintendo Switch",
        "PlayStation",
        "Xbox",
        "PC",
      ]}
    />
  );
}

export default VideoGames;
