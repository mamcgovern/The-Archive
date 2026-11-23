
import CollectionPage from "./CollectionPage";
import { collectionItems } from "../data/sampleData";

function VideoGames() {
  const items = collectionItems.filter((item) => item.category === "Video Games");

  return (
    <CollectionPage
      title="Video Games"
      description="Every game in your household collection."
      items={items}
      filters={["Playing", "Completed", "Backlog", "Nintendo Switch", "PlayStation", "Xbox", "PC"]}
    />
  );
}

export default VideoGames;
