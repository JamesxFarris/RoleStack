import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SavedJobsProvider } from './context/SavedJobsContext';
import { Layout } from './components/Layout';
import { JobSearchPage } from './pages/JobSearchPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { SavedJobsPage } from './pages/SavedJobsPage';

function App() {
  return (
    <BrowserRouter>
      <SavedJobsProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<JobSearchPage />} />
            <Route path="/job/:id" element={<JobDetailPage />} />
            <Route path="/saved" element={<SavedJobsPage />} />
          </Routes>
        </Layout>
      </SavedJobsProvider>
    </BrowserRouter>
  );
}

export default App;
