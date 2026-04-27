import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import SpeakerDetailPage from './pages/SpeakerDetailPage'
import SearchResultsPage from './pages/SearchResultsPage'
import EnquiryPage from './pages/EnquiryPage'
import AboutPage from './pages/AboutPage'
import AdminApp from './admin/AdminApp'
import SpeakerPortalPage from './pages/SpeakerPortalPage'
import SpeakersPage from './pages/SpeakersPage'
import BookPage from './pages/BookPage'
import NewsPage from './pages/NewsPage'
import NewsArticlePage from './pages/NewsArticlePage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* Admin dashboard — separate shell, no public layout */}
      <Route path="/admin/*" element={<AdminApp />} />

      {/* Speaker portal — public magic-link form, no layout shell.
          New invites pass the token via URL hash (#xxx) so it never reaches
          the server in logs/Referer. The legacy /:token path is kept so
          previously-issued links still work until they expire. */}
      <Route path="/speaker-portal" element={<SpeakerPortalPage />} />
      <Route path="/speaker-portal/:token" element={<SpeakerPortalPage />} />

      {/* Enquiry pages — full-screen Typeform-style, no layout shell */}
      <Route path="/enquiry" element={<EnquiryPage />} />
      <Route path="/enquiry/:speakerId" element={<EnquiryPage />} />

      {/* All other pages — standard layout with header/footer */}
      <Route path="*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/speakers" element={<SpeakersPage />} />
            <Route path="/speakers/:id" element={<SpeakerDetailPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsArticlePage />} />
          </Routes>
        </Layout>
      } />
    </Routes>
    </>
  )
}

export default App
