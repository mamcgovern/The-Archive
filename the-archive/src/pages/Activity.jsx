
import { useParams } from "react-router-dom";
import { BookOpen, Play, Gamepad2, Clock3 } from "lucide-react";

const activityData = {
  reading: {
    title: "Reading",
    description: "Books you're reading, have finished, or want to read.",
    icon: BookOpen,
    entries: [
      { title: "Fourth Wing", creator: "Rebecca Yarros", person: "Maddie", status: "Currently reading", progress: "62%" },
      { title: "The Seven Husbands of Evelyn Hugo", creator: "Taylor Jenkins Reid", person: "Maddie", status: "Finished", progress: "Completed" },
    ],
  },
  watching: {
    title: "Watching",
    description: "Keep track of movies and shows you've watched together or individually.",
    icon: Play,
    entries: [
      { title: "The Office", creator: "TV Series", person: "Maddie & Nick", status: "Currently watching", progress: "Season 3" },
      { title: "Interstellar", creator: "Christopher Nolan", person: "Nick", status: "Watched", progress: "Completed" },
    ],
  },
  playing: {
    title: "Playing",
    description: "Your current games, completed games, and gaming history.",
    icon: Gamepad2,
    entries: [
      { title: "Stardew Valley", creator: "ConcernedApe", person: "Nick", status: "Currently playing", progress: "In progress" },
      { title: "Mario Kart 8 Deluxe", creator: "Nintendo", person: "Maddie & Nick", status: "Playing", progress: "Ongoing" },
    ],
  },
};

function Activity() {
  const { type } = useParams();
  const activity = activityData[type];
  const Icon = activity?.icon;

  if (!activity) {
    return (
      <div className="empty-collection">
        <h2>Activity not found</h2>
        <p>Choose Reading, Watching, or Playing from the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR PERSONAL HISTORY</div>
          <h1>{activity.title}</h1>
          <p>{activity.description}</p>
        </div>
        <div className="page-heading-icon"><Icon size={27} /></div>
      </div>

      <div className="activity-page-list">
        {activity.entries.map((entry) => (
          <article className="activity-record" key={entry.title}>
            <div className="activity-record-icon"><Icon size={22} /></div>
            <div className="activity-record-main">
              <h3>{entry.title}</h3>
              <p>{entry.creator}</p>
              <span>{entry.person}</span>
            </div>
            <div className="activity-record-status">
              <strong>{entry.status}</strong>
              <span>{entry.progress}</span>
            </div>
            <Clock3 size={17} className="record-clock" />
          </article>
        ))}
      </div>
    </div>
  );
}

export default Activity;
