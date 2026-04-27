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
import PressPage from './pages/PressPage'
import PressArticlePage from './pages/PressArticlePage'

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

      {/* Speaker portal — public magic-link form, no layout shell */}
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
            {/* DEV-ONLY: Press routes. Remove the conditional when ready to ship. */}
            {import.meta.env.DEV && <Route path="/press" element={<PressPage />} />}
            {import.meta.env.DEV && <Route path="/press/:slug" element={<PressArticlePage />} />}
          </Routes>
        </Layout>
      } />
    </Routes>
    </>
  )
}

export default App
