import { useLocation } from 'react-router-dom'
import Header from './Header/Header'
import Footer from './Footer'
import AccessibilityMenu from './AccessibilityMenu'
import './Layout.css'

function Layout({ children }) {
  const location = useLocation()
  // Show the FAB trigger only on home — other pages reserve the bottom-right
  // for sticky CTAs (BriefActions on search/enquiry). The component itself
  // stays mounted everywhere so the footer-link event still opens the panel.
  const showFab = location.pathname === '/'
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
      <AccessibilityMenu showTrigger={showFab} />
    </div>
  )
}

export default Layout
