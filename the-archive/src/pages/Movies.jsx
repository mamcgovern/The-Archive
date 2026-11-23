
import CollectionPage from "./CollectionPage";
import { collectionItems } from "../data/sampleData";

function Movies() {
  const items = collectionItems.filter((item) => item.category === "Movies & TV");

  return (
    <CollectionPage
      title="Movies & TV"
      description="Your collection of films, series, and favorites."
      items={items}
      filters={["Watching", "Watched", "Want to Watch", "Blu-ray", "DVD", "4K"]}
    />
  );
}

export default Movies;
