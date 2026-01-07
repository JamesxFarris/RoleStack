import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { JobSearchPage } from './pages/JobSearchPage';
import { JobDetailPage } from './pages/JobDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<JobSearchPage />} />
          <Route path="/job/:id" element={<JobDetailPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
