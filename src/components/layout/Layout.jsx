import Header from './Header'
import Footer from './Footer'
import AccessibilityMenu from './AccessibilityMenu'
import './Layout.css'

function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
      <AccessibilityMenu />
    </div>
  )
}

export default Layout
