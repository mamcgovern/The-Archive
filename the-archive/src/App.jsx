
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Movies from "./pages/Movies";
import VideoGames from "./pages/VideoGames";
import BoardGames from "./pages/BoardGames";
import Activity from "./pages/Activity";
import Wishlist from "./pages/Wishlist";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<Books />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/video-games" element={<VideoGames />} />
          <Route path="/board-games" element={<BoardGames />} />
          <Route path="/activity/:type" element={<Activity />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
