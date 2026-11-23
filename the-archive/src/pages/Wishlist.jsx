
import { Heart, Plus, Search } from "lucide-react";
import { useState } from "react";
import { wishlistItems } from "../data/sampleData";

function Wishlist() {
  const [search, setSearch] = useState("");

  const filteredItems = wishlistItems.filter((item) =>
    `${item.title} ${item.creator} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="wishlist-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SOMEDAY, SOON</div>
          <h1>Wishlist</h1>
          <p>All the things you'd love to bring home.</p>
        </div>
        <button className="add-button">
          <Plus size={17} />
          Add to wishlist
        </button>
      </div>

      <div className="collection-toolbar">
        <label className="collection-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search your wishlist..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      <div className="collection-summary">
        <span><strong>{filteredItems.length}</strong> items wanted</span>
      </div>

      <div className="wishlist-grid">
        {filteredItems.map((item) => (
          <article className="wishlist-card" key={item.id}>
            <div className="wishlist-cover">
              {item.cover ? (
                <img src={item.cover} alt={`${item.title} cover`} />
              ) : (
                <Heart size={30} />
              )}
            </div>
            <div className="wishlist-card-info">
              <span className="wishlist-category">{item.category}</span>
              <h3>{item.title}</h3>
              <p>{item.creator}</p>
              <div className="wishlist-owner">Wanted by {item.owner}</div>
            </div>
          </article>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-collection">
          <Heart size={28} />
          <h3>Your wishlist is empty</h3>
          <p>Try another search or add something you'd like to own.</p>
        </div>
      )}
    </div>
  );
}

export default Wishlist;
