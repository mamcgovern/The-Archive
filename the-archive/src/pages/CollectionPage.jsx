
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  Plus,
  MapPin,
  Star,
  Pencil,
  BookOpen,
} from "lucide-react";

function CollectionPage({
  title,
  description,
  items = [],
  filters = [],
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredItems = useMemo(() => {
    return [...items]
      .filter((item) => {
        const searchableText = [
          item.title,
          item.creator,
          item.format,
          item.owner,
          item.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = searchableText.includes(
          search.toLowerCase()
        );

        const matchesFilter =
          filter === "All" ||
          item.status === filter ||
          item.format === filter;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const dateA =
          a.createdAt?.toDate?.() ||
          (a.dateAdded ? new Date(a.dateAdded) : new Date(0));

        const dateB =
          b.createdAt?.toDate?.() ||
          (b.dateAdded ? new Date(b.dateAdded) : new Date(0));

        return dateB - dateA;
      });
  }, [items, search, filter]);

  function formatRatingsCount(count) {
    return new Intl.NumberFormat("en-US").format(count);
  }

  return (
    <div className="collection-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR HOUSEHOLD COLLECTION</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <Link to="/add" className="add-button">
          <Plus size={17} />
          Add Book
        </Link>
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
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="All">All items</option>
            {filters
              .filter((option) => option !== "All")
              .map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="collection-summary">
        <span>
          <strong>{filteredItems.length}</strong>{" "}
          {filteredItems.length === 1 ? "item" : "items"}
        </span>
        <span>Sorted by recently added</span>
      </div>

      {filteredItems.length > 0 ? (
        <div className="collection-grid">
          {filteredItems.map((item) => {
            const communityRating =
              item.googleBooksRating ?? item.goodreadsRating;

            const communityRatingsCount =
              item.googleBooksRatingsCount ??
              item.goodreadsRatingsCount;

            return (
              <article className="collection-card" key={item.id}>
                <div className="collection-cover">
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={`${item.title} cover`}
                    />
                  ) : (
                    <div className="cover-placeholder">
                      {item.title}
                    </div>
                  )}

                  {item.format && (
                    <span className="cover-format">
                      {item.format}
                    </span>
                  )}
                </div>

                <div className="collection-card-info">
                  <h3>{item.title}</h3>
                  <p>{item.creator || "Creator unknown"}</p>

                  <div className="collection-card-meta">
                    <span>{item.year || "Year unknown"}</span>
                    <span>{item.owner || "Shared"}</span>
                  </div>

                  <div className="collection-card-footer">
                    {item.status && (
                      <span className="status-tag">
                        {item.status}
                      </span>
                    )}

                    {item.rating != null && (
                      <span className="rating">
                        <Star size={13} fill="currentColor" />
                        {item.rating}
                      </span>
                    )}
                  </div>

                  {communityRating != null && (
                    <div className="goodreads-rating">
                      <div className="goodreads-rating-score">
                        <BookOpen size={14} />
                        <strong>
                          {Number(communityRating).toFixed(2)}
                        </strong>
                        <span>/ 5</span>
                      </div>

                      <span className="goodreads-rating-label">
                        Community
                      </span>

                      {communityRatingsCount != null && (
                        <span className="goodreads-rating-count">
                          {formatRatingsCount(
                            communityRatingsCount
                          )}{" "}
                          ratings
                        </span>
                      )}
                    </div>
                  )}

                  {item.location && (
                    <div className="storage-location">
                      <MapPin size={12} />
                      {item.location}
                    </div>
                  )}

                  <Link
                    to={`/add?edit=${encodeURIComponent(item.id)}`}
                    className="edit-item-button"
                  >
                    <Pencil size={14} />
                    Edit book
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-collection">
          <Search size={28} />
          <h3>No items found</h3>
          <p>
            {search || filter !== "All"
              ? "Try a different search or filter."
              : `You haven't added any ${title.toLowerCase()} yet.`}
          </p>

          {!search && filter === "All" && (
            <Link to="/add" className="add-button">
              <Plus size={17} />
              Add your first book
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default CollectionPage;
