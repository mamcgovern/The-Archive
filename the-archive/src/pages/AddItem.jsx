

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clapperboard, Gamepad2, Dice5, Save } from "lucide-react";

const categories = [
  { name: "Books", icon: BookOpen },
  { name: "Movies & TV", icon: Clapperboard },
  { name: "Video Games", icon: Gamepad2 },
  { name: "Board Games", icon: Dice5 },
];

const initialForm = {
  title: "",
  creator: "",
  category: "Books",
  format: "Paperback",
  year: "",
  owner: "Shared",
  location: "",
  status: "Owned",
  cover: "",
  notes: "",
};

const formats = {
  "Books": ["Paperback", "Hardcover", "Ebook", "Audiobook"],
  "Movies & TV": ["DVD", "Blu-ray", "4K UHD", "Digital"],
  "Video Games": ["Nintendo Switch", "PlayStation", "Xbox", "PC", "Other"],
  "Board Games": ["Board Game", "Card Game", "Other"],
};

const statuses = {
  "Books": ["Owned", "Want to Read", "Reading", "Finished"],
  "Movies & TV": ["Owned", "Want to Watch", "Watching", "Watched"],
  "Video Games": ["Owned", "Backlog", "Playing", "Completed"],
  "Board Games": ["Owned", "Want to Play", "Currently Playing"],
};

function AddItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Please enter an item title.");
      return;
    }

    const newItem = {
      ...form,
      id: crypto.randomUUID(),
      title: form.title.trim(),
      creator: form.creator.trim() || "Unknown",
      year: form.year ? Number(form.year) : null,
      dateAdded: new Date().toISOString(),
      rating: null,
    };

    const existingItems = JSON.parse(
      localStorage.getItem("archiveItems") || "[]"
    );

    localStorage.setItem(
      "archiveItems",
      JSON.stringify([...existingItems, newItem])
    );

    setError("");
    navigate(`/${form.category === "Books" ? "books" : form.category === "Movies & TV" ? "movies" : form.category === "Video Games" ? "video-games" : "board-games"}`);
  };

  return (
    <div className="add-item-page">
      <button className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back to collection
      </button>

      <div className="page-heading">
        <div>
          <div className="eyebrow">GROW YOUR LIBRARY</div>
          <h1>Add an item</h1>
          <p>Keep track of everything your household owns.</p>
        </div>
      </div>

      <form className="add-item-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step">01</span>
            <div>
              <h2>What are we adding?</h2>
              <p>Choose the type of media you want to catalog.</p>
            </div>
          </div>

          <div className="category-selector">
            {categories.map(({ name, icon: Icon }) => (
              <button
                type="button"
                key={name}
                className={`category-option ${form.category === name ? "selected" : ""}`}
                onClick={() => {
                  updateField("category", name);
                  updateField("format", formats[name][0]);
                  updateField("status", statuses[name][0]);
                }}
              >
                <Icon size={22} />
                <span>{name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step">02</span>
            <div>
              <h2>Item details</h2>
              <p>Enter the basic information about your item.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="form-field full-width">
              <span>Title <strong>*</strong></span>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Enter the title"
                required
              />
            </label>

            <label className="form-field">
              <span>{form.category === "Books" ? "Author" : form.category === "Video Games" ? "Developer" : form.category === "Movies & TV" ? "Director / Creator" : "Designer"}</span>
              <input
                value={form.creator}
                onChange={(event) => updateField("creator", event.target.value)}
                placeholder="Enter creator"
              />
            </label>

            <label className="form-field">
              <span>Release year</span>
              <input
                type="number"
                min="1800"
                max="2100"
                value={form.year}
                onChange={(event) => updateField("year", event.target.value)}
                placeholder="e.g. 2024"
              />
            </label>

            <label className="form-field">
              <span>Format</span>
              <select
                value={form.format}
                onChange={(event) => updateField("format", event.target.value)}
              >
                {formats[form.category].map((format) => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                {statuses[form.category].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            <label className="form-field full-width">
              <span>Cover image URL</span>
              <input
                value={form.cover}
                onChange={(event) => updateField("cover", event.target.value)}
                placeholder="Paste an image URL (optional)"
              />
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="form-step">03</span>
            <div>
              <h2>Ownership & storage</h2>
              <p>Keep track of who owns it and where to find it.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>Owned by</span>
              <select
                value={form.owner}
                onChange={(event) => updateField("owner", event.target.value)}
              >
                <option value="Shared">Maddie & Nick</option>
                <option value="Maddie">Maddie</option>
                <option value="Nick">Nick</option>
              </select>
            </label>

            <label className="form-field">
              <span>Storage location</span>
              <input
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                placeholder="e.g. Living room bookshelf"
              />
            </label>

            <label className="form-field full-width">
              <span>Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Anything else you want to remember..."
                rows={3}
              />
            </label>
          </div>
        </section>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="add-button">
            <Save size={16} />
            Save to collection
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddItem;
