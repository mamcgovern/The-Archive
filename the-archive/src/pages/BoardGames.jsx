
import CollectionPage from "./CollectionPage";
import { collectionItems } from "../data/sampleData";

function BoardGames() {
  const items = collectionItems.filter((item) => item.category === "Board Games");

  return (
    <CollectionPage
      title="Board Games"
      description="Your tabletop collection, ready for game night."
      items={items}
      filters={["Owned", "Want to Play", "Currently Playing"]}
    />
  );
}

export default BoardGames;
