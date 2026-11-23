
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Plus, MapPin, Star } from "lucide-react";

function CollectionPage({ title, description, items, filters = [] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = `${item.title} ${item.creator} ${item.format}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        item.status === filter ||
        item.format === filter;

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  return (
    <div className="collection-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR HOUSEHOLD COLLECTION</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button className="add-button">
          <Plus size={17} />
          Add item
        </button>
      </div>

      <div className="collection-toolbar">
        <label className="collection-search">
          <Search size={17} />
          <input
            type="search"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="filter-control">
          <SlidersHorizontal size={16} />
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="All">All items</option>
            {filters.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="collection-summary">
        <span><strong>{filteredItems.length}</strong> items</span>
        <span>Sorted by recently added</span>
      </div>

      {filteredItems.length > 0 ? (
        <div className="collection-grid">
          {filteredItems.map((item) => (
            <article className="collection-card" key={item.id}>
              <div className="collection-cover">
                {item.cover ? (
                  <img src={item.cover} alt={`${item.title} cover`} />
                ) : (
                  <div className="cover-placeholder">{item.title}</div>
                )}
                <span className="cover-format">{item.format}</span>
              </div>

              <div className="collection-card-info">
                <h3>{item.title}</h3>
                <p>{item.creator}</p>
                <div className="collection-card-meta">
                  <span>{item.year}</span>
                  <span>{item.owner}</span>
                </div>
                <div className="collection-card-footer">
                  <span className="status-tag">{item.status}</span>
                  {item.rating && (
                    <span className="rating">
                      <Star size={13} fill="currentColor" />
                      {item.rating}
                    </span>
                  )}
                </div>
                {item.location && (
                  <div className="storage-location">
                    <MapPin size={12} />
                    {item.location}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-collection">
          <Search size={28} />
          <h3>No items found</h3>
          <p>Try a different search or filter.</p>
        </div>
      )}
    </div>
  );
}

export default CollectionPage;
