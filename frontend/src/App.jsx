import { useEffect, useState } from 'react'
import './App.css'

const quickStats = [
  { label: 'Courses indexed', value: '2,480+' },
  { label: 'Faculty answers', value: '94%' },
  { label: 'Avg. response time', value: '12 sec' },
  { label: 'Student satisfaction', value: '4.9/5' },
]

const suggestionPills = [
  'Admissions requirements',
  'Exam schedule',
  'Capstone timeline',
  'Scholarship policy',
]

const defaultContactPrompts = [
  'What are the graduation requirements for the Computer Science major?',
  'Can you summarize the latest internship opportunities for engineering students?',
  'Where can I find the deadlines for scholarship applications?',
]

const recentQuestions = [
  'How do I change my major within the faculty of sciences?',
  'Which electives are recommended for AI and data science students?',
  'When is the final exam timetable released for Semester 2?',
]

const agenda = [
  { time: '09:00', title: 'Admissions Q&A' },
  { time: '11:30', title: 'CS seminar registration' },
  { time: '14:00', title: 'Scholarship advising' },
]

const initialMessages = [
  {
    sender: 'assistant',
    text: 'I can help with academic policies, course planning, scholarships, and student services. Ask anything about the university.',
  },
]

const API_BASE_URL = 'http://localhost:8000'

function App() {
  const [knowledgeAreas, setKnowledgeAreas] = useState([
    'Academic policies',
    'Course catalog',
    'Research hubs',
    'Student services',
    'Scholarships',
    'Faculty office hours',
  ])
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState(
    'What are the graduation requirements for the Computer Science major?',
  )
  const [prompts, setPrompts] = useState(defaultContactPrompts)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadKnowledgeAreas = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/knowledge/areas`)
        if (!response.ok) {
          throw new Error('Failed to fetch knowledge areas')
        }

        const data = await response.json()
        if (Array.isArray(data.areas) && data.areas.length > 0) {
          setKnowledgeAreas(data.areas)
        }
      } catch (err) {
        console.error('Knowledge areas unavailable:', err)
      }
    }

    loadKnowledgeAreas()
  }, [])

  const handleAsk = async (question) => {
    const trimmed = question.trim()
    if (!trimmed || isLoading) return

    setInput(trimmed)
    setError('')
    setMessages((prev) => [...prev, { sender: 'student', text: trimmed }])
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
      })

      if (!response.ok) {
        throw new Error('Unable to get a response from the backend')
      }

      const data = await response.json()
      setMessages((prev) => [...prev, { sender: 'assistant', text: data.answer }])

      if (Array.isArray(data.suggested_questions) && data.suggested_questions.length > 0) {
        setPrompts(data.suggested_questions)
      }
    } catch (err) {
      console.error(err)
      setError('The backend is unavailable right now. Please try again in a moment.')
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'I could not reach the university service right now. Please try again in a moment.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    handleAsk(input)
  }

  const resetConversation = () => {
    setMessages(initialMessages)
    setError('')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">U</div>
          <div>
            <p className="eyebrow">University AI</p>
            <h2>Knowledge Assistant</h2>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#overview">Overview</a>
          <a href="#explore">Explore</a>
          <a href="#resources">Resources</a>
          <a href="#support">Support</a>
        </nav>

        <button type="button" className="primary-btn" onClick={() => handleAsk(input)}>
          Ask AI
        </button>
      </header>

      <main className="dashboard" id="overview">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="badge">Smart campus guidance</span>
            <h1>Find answers faster with an AI-powered university assistant.</h1>
            <p>
              Search course requirements, academic policies, scholarships, and student
              services in one conversational hub designed for students and staff.
            </p>

            <form className="search-box" role="search" onSubmit={handleSearchSubmit}>
              <span className="search-icon">⌕</span>
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                aria-label="Ask the university assistant"
              />
              <button type="submit" className="primary-btn small-btn" disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Search'}
              </button>
            </form>

            {error && <p className="error-banner">{error}</p>}

            <div className="suggestion-row" aria-label="Popular searches">
              {suggestionPills.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="chip"
                  onClick={() => handleAsk(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-label="Assistant summary">
            <div className="visual-card main-card">
              <div className="card-topline">
                <span className="dot green" />
                Live campus insight
              </div>
              <h3>Today’s top priority</h3>
              <p>Course planning and graduation readiness for the 2026 intake.</p>
              <div className="mini-metrics">
                <div>
                  <strong>86%</strong>
                  <span>students on track</span>
                </div>
                <div>
                  <strong>24</strong>
                  <span>new matches</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-grid" aria-label="Key metrics">
          {quickStats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </section>

        <section className="content-grid" id="explore">
          <div className="chat-panel card-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow subtle">AI conversation</p>
                <h3>Ask about your campus journey</h3>
              </div>
              <button type="button" className="ghost-btn" onClick={resetConversation}>
                New chat
              </button>
            </div>

            <div className="messages" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  key={`${message.sender}-${index}`}
                  className={`message ${message.sender === 'assistant' ? 'assistant' : 'student'}`}
                >
                  <div className="avatar">{message.sender === 'assistant' ? 'AI' : 'S'}</div>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>

            <div className="prompt-list" aria-label="Suggested prompts">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="prompt-item"
                  onClick={() => handleAsk(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <aside className="sidebar" id="resources">
            <div className="card-panel">
              <div className="panel-header compact">
                <div>
                  <p className="eyebrow subtle">Knowledge areas</p>
                  <h3>Campus coverage</h3>
                </div>
              </div>
              <div className="tag-cloud">
                {knowledgeAreas.map((area) => (
                  <span key={area} className="tag">
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="card-panel" id="support">
              <div className="panel-header compact">
                <div>
                  <p className="eyebrow subtle">Today</p>
                  <h3>Student agenda</h3>
                </div>
              </div>
              <ul className="agenda-list">
                {agenda.map((item) => (
                  <li key={item.title}>
                    <span className="time-pill">{item.time}</span>
                    <span>{item.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-panel">
              <div className="panel-header compact">
                <div>
                  <p className="eyebrow subtle">Recent</p>
                  <h3>Popular questions</h3>
                </div>
              </div>
              <ul className="recent-list">
                {recentQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default App
