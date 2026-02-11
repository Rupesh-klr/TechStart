import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from './components/layout/AppLayout';
import { HomeFeed } from './pages/HomeFeed';
import { InfiniteScrollHomeFeed } from './pages/InfiniteScrollHomeFeed';
import { GlobalPlayer } from './components/video/GlobalPlayer';
import { VideoPlayerOverlay } from './components/player/VideoPlayerOverlay';

function App() {
  return (
    <>
      {/* Default SEO Tags */}
      <Helmet>
        <title>DinoPlay | Next Gen Video</title>
        <meta name="description" content="Watch AI generated videos with seamless playback." />
      </Helmet>

      <Routes>
        {/* Wrap all pages inside the AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeFeed />} />
          <Route path="/infinite" element={<InfiniteScrollHomeFeed />} />
          {/* Add future routes here, e.g., <Route path="/video/:id" ... /> */}
        </Route>
      </Routes>
      {/* Add this at the bottom so it floats above everything */}
      {/* <GlobalPlayer /> */}
      <VideoPlayerOverlay />
    </>
  );
}

export default App;