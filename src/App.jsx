import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import SpeakerDetailPage from './pages/SpeakerDetailPage'
import SearchResultsPage from './pages/SearchResultsPage'
import EnquiryPage from './pages/EnquiryPage'
import AboutPage from './pages/AboutPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/speakers/:id" element={<SpeakerDetailPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/enquiry" element={<EnquiryPage />} />
        <Route path="/enquiry/:speakerId" element={<EnquiryPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Layout>
  )
}

export default App
