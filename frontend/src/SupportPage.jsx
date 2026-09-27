import { useNavigate } from 'react-router-dom'
import SupportSection from './SupportSection'
import './Support.css'

export default function SupportPage({ isDark, setIsDark, Navbar }) {
  const navigate = useNavigate()

  const handleAskAI = () => {
    navigate('/ai')
  }

  const handleToggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <div className={`app-shell ${isDark ? 'theme-dark' : 'theme-light'} support-page-wrapper`}>
      {Navbar ? (
        <Navbar isDark={isDark} onToggleTheme={handleToggleTheme} onAskAI={handleAskAI} />
      ) : null}

      <main className="support-main-content">
        <SupportSection />
      </main>
    </div>
  )
}
