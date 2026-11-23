
import CollectionPage from "./CollectionPage";
import { collectionItems } from "../data/sampleData";

function Books() {
  const items = collectionItems.filter((item) => item.category === "Books");

  return (
    <CollectionPage
      title="Books"
      description="Every story on your shelves, all in one place."
      items={items}
      filters={["Reading", "Finished", "Want to Read", "Paperback", "Hardcover", "Audiobook"]}
    />
  );
}

export default Books;
