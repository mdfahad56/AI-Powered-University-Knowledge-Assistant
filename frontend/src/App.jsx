import { useEffect, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './App.css'

const quickStats = [
  { label: 'AKTU colleges', value: '800+' },
  { label: 'Student network', value: '2.5L+' },
  { label: 'Career support', value: '94%' },
  { label: 'Program range', value: '150+' },
]

const suggestionPills = [
  'AKTU admission process',
  'Semester exam schedule',
  'Scholarship eligibility',
  'Course registration steps',
]

const defaultContactPrompts = [
  'What are the graduation requirements for the B.Tech program at AKTU?',
  'How can I check the latest semester exam timetable and result updates?',
  'Which scholarships are available for AKTU students and how do I apply?',
]

const recentQuestions = [
  'How do I change my branch or specialization in AKTU?',
  'Which electives are recommended for Computer Science and AI students?',
  'When are AKTU counselling and admission deadlines announced?',
]

const agenda = [
  { time: '09:00', title: 'AKTU admissions Q&A' },
  { time: '11:30', title: 'Semester registration help' },
  { time: '14:00', title: 'Scholarship advising' },
]

const initialMessages = [
  {
    sender: 'assistant',
    text: 'I can help with AKTU admissions, semester rules, exam dates, scholarships, and student support. Ask me anything about the university.',
  },
]

const buildFreshConversation = () => ({
  messages: initialMessages,
  prompts: defaultContactPrompts,
  input: '',
})

const API_BASE_URL = 'http://localhost:8000'

const cutoffData = [
  { year: '2021', branch: 'CSE', score: '89.5%', seats: '620' },
  { year: '2022', branch: 'CSE', score: '91.2%', seats: '610' },
  { year: '2023', branch: 'CSE', score: '90.8%', seats: '635' },
  { year: '2024', branch: 'CSE', score: '92.4%', seats: '600' },
  { year: '2025', branch: 'CSE', score: '93.1%', seats: '590' },
  { year: '2021', branch: 'ECE', score: '82.6%', seats: '540' },
  { year: '2022', branch: 'ECE', score: '84.1%', seats: '530' },
  { year: '2023', branch: 'ECE', score: '85.7%', seats: '520' },
  { year: '2024', branch: 'ECE', score: '86.9%', seats: '510' },
  { year: '2025', branch: 'ECE', score: '88.2%', seats: '500' },
]

const questionPaperCategories = [
  {
    slug: 'b-pharm',
    label: 'B.Pharm',
    officialUrl: 'https://www.abesit.in/library/question-paper-bank/',
    semesters: [
      {
        label: '1st Sem.',
        years: {
          '2017-18': [
            'HUMAN-ANATOMY-PHYSIOLOGY-BP-101T.pdf',
            'PHARMACEUTICAL-ANALYSIS-1-BP-102T.pdf',
            'PHARMACEUTICAL-INORGANIC-CHEMISTRY-BP-104T.pdf',
            'PHARMACEUTICS-1-BP-103T.pdf',
          ],
          '2018-19': [
            'HUMAN-ANATOMY-PHYSIOLOGY-BP-101T.pdf',
            'PHARMACEUTICAL-ANALYSIS-1-BP-102T.pdf',
          ],
        },
      },
      {
        label: '2nd Sem.',
        years: {
          '2017-18': [
            'PHARMACEUTICAL-ORGANIC-CHEMISTRY-1-BP-201T.pdf',
            'BIOCHEMISTRY-BP-202T.pdf',
          ],
          '2018-19': ['PHARMACEUTICAL-ORGANIC-CHEMISTRY-1-BP-201T.pdf'],
        },
      },
    ],
  },
  {
    slug: 'b-tech',
    label: 'B.Tech',
    officialUrl: 'https://www.abesit.in/library/question-paper-bank/',
    semesters: [
      { label: '1st Sem.', years: { '2017-18': ['Engineering-Mathematics-1.pdf'], '2018-19': ['Engineering-Mathematics-1.pdf'] } },
      { label: '2nd Sem.', years: { '2017-18': ['Engineering-Mathematics-2.pdf'], '2018-19': ['Engineering-Mathematics-2.pdf'] } },
    ],
  },
  {
    slug: 'bba',
    label: 'BBA',
    officialUrl: 'https://www.abesit.in/library/question-paper-bank/',
    semesters: [
      { label: '1st Sem.', years: { '2017-18': ['Business-Organisation.pdf'], '2018-19': ['Business-Organisation.pdf'] } },
      { label: '2nd Sem.', years: { '2017-18': ['Business-Communication.pdf'], '2018-19': ['Business-Communication.pdf'] } },
    ],
  },
  {
    slug: 'bca',
    label: 'BCA',
    officialUrl: 'https://www.abesit.in/library/question-paper-bank/',
    semesters: [
      { label: '1st Sem.', years: { '2017-18': ['Computer-Fundamentals.pdf'], '2018-19': ['Computer-Fundamentals.pdf'] } },
      { label: '2nd Sem.', years: { '2017-18': ['Digital-Logic.pdf'], '2018-19': ['Digital-Logic.pdf'] } },
    ],
  },
  {
    slug: 'mca',
    label: 'MCA',
    officialUrl: 'https://www.abesit.in/library/question-paper-bank/',
    semesters: [
      { label: '1st Sem.', years: { '2017-18': ['Programming-in-C.pdf'], '2018-19': ['Programming-in-C.pdf'] } },
      { label: '2nd Sem.', years: { '2017-18': ['Data-Structures.pdf'], '2018-19': ['Data-Structures.pdf'] } },
    ],
  },
]

function Navbar({ isDark, onToggleTheme, onAskAI }) {
  return (
    <header className={`topbar ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <div className="brand-wrap">
        <div className="brand-mark">U</div>
        <div>
          <p className="eyebrow">University AI</p>
          <h2>Knowledge Assistant</h2>
        </div>
      </div>

      <nav className="main-nav" aria-label="Main navigation">
        <Link to="/">Overview</Link>
        <Link to="/ai">AI Chat</Link>
        <Link to="/resources">Resources</Link>
        <Link to="/">Support</Link>
      </nav>

      <div className="navbar-actions">
        <button type="button" className="theme-toggle" onClick={onToggleTheme}>
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>
        <button type="button" className="primary-btn" onClick={onAskAI}>
          Ask AI
        </button>
      </div>
    </header>
  )
}

function DashboardPage({ isDark, setIsDark }) {
  const navigate = useNavigate()
  const [knowledgeAreas, setKnowledgeAreas] = useState([
    'Academic policies',
    'Course catalog',
    'Research hubs',
    'Student services',
    'Scholarships',
    'Faculty office hours',
  ])
  const resourceLinks = [{ label: 'Question Paper - ABESIT', url: '/resources' }]
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [prompts, setPrompts] = useState(defaultContactPrompts)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [chatTitle, setChatTitle] = useState('AKTU AI Assistant')

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

    setIsChatOpen(true)
    setChatTitle('AKTU AI Assistant')
    setInput('')
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
    const nextState = buildFreshConversation()
    setMessages(nextState.messages)
    setInput(nextState.input)
    setPrompts(nextState.prompts)
    setError('')
    setChatTitle('AKTU AI Assistant')
    setIsChatOpen(true)
  }

  return (
    <div className={`app-shell ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark((current) => !current)}
        onAskAI={() => {
          navigate('/ai')
          if (input.trim()) {
            handleAsk(input)
          }
        }}
      />

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

          <div className="hero-visual" aria-label="AKTU campus summary">
            <div className="visual-card main-card">
              <img
                className="aktu-visual-image"
                src="https://collegeforum.in/apis/assets/uploads/2026/04/collegeCoverPhotos/collegeCoverPhoto-1775724079329-616012862.webp"
                alt="AKTU campus and students"
              />
              <div className="card-topline">
                <span className="dot green" />
                Live campus insight
              </div>
              <h3>Today’s top priority</h3>
              <p>Course planning, admission guidance, and exam readiness for AKTU students.</p>
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
          <div className={`chat-panel card-panel ${isChatOpen ? 'open' : 'closed'}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow subtle">AI conversation</p>
                <h3>{chatTitle}</h3>
              </div>
              <div className="chat-actions">
                <button type="button" className="ghost-btn" onClick={() => setIsChatOpen(false)}>
                  Minimize
                </button>
                <button type="button" className="ghost-btn" onClick={resetConversation}>
                  New chat
                </button>
              </div>
            </div>

            {isChatOpen ? (
              <>
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
              </>
            ) : (
              <button type="button" className="primary-btn reopen-btn" onClick={() => setIsChatOpen(true)}>
                Open assistant
              </button>
            )}
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
                  <p className="eyebrow subtle">Resources</p>
                  <h3>Question papers</h3>
                </div>
              </div>
              <ul className="resource-list">
                {resourceLinks.map((resource) => (
                  <li key={resource.label}>
                    <Link to={resource.url}>{resource.label}</Link>
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

function AiPage({ isDark, setIsDark }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'I can help with AKTU admissions, semester timelines, course planning, scholarships, and student support. Ask anything about the university.',
    },
  ])
  const [input, setInput] = useState('')
  const [prompts, setPrompts] = useState(defaultContactPrompts)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAsk = async (question) => {
    const trimmed = question.trim()
    if (!trimmed || isLoading) return

    setInput('')
    setError('')
    setMessages((prev) => [...prev, { sender: 'student', text: trimmed }])
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setError('The AI backend is unavailable right now. Please try again in a moment.')
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'I could not reach the university AI service right now. Please try again in a moment.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    handleAsk(input)
  }

  const resetConversation = () => {
    setMessages([
      {
        sender: 'assistant',
        text: 'I can help with AKTU admissions, semester timelines, course planning, scholarships, and student support. Ask anything about the university.',
      },
    ])
    setPrompts(defaultContactPrompts)
    setInput('')
    setError('')
  }

  return (
    <div className={`app-shell ai-page-shell ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark((current) => !current)}
        onAskAI={() => navigate('/ai')}
      />

      <main className="ai-page-content">
        <div className="chat-layout">
          <aside className="ai-sidebar">
            <button type="button" className="new-chat-btn" onClick={resetConversation}>
              + New Chat
            </button>

            <div className="sidebar-group">
              <h4>Features</h4>
              <ul>
                <li>Chat</li>
                <li>Archived</li>
                <li>Library</li>
              </ul>
            </div>

            <div className="sidebar-group">
              <h4>Workspaces</h4>
              <ul>
                <li>New Project</li>
                <li>Image</li>
                <li>Presentation</li>
                <li>Reset</li>
              </ul>
            </div>
          </aside>

          <section className="ai-main-panel">
            <div className="ai-main-header">
              <div className="ai-room-label">AKTU AI Assistant</div>
              <span className="ai-pill">Live</span>
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
              {isLoading && <div className="message assistant"><div className="avatar">AI</div><p>Thinking...</p></div>}
            </div>

            {error && <p className="error-banner">{error}</p>}

            <div className="prompt-list" aria-label="Suggested prompts">
              {prompts.map((prompt) => (
                <button key={prompt} type="button" className="prompt-item" onClick={() => handleAsk(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            <form className="chat-input-row" onSubmit={handleSubmit}>
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything about AKTU..."
                aria-label="Ask the university AI"
              />
              <button type="submit" className="primary-btn small-btn" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}

function QuestionPaperCard({ item }) {
  return (
    <Link to={`/resources/${item.slug}`} className="paper-card" aria-label={`Open ${item.label} question papers`}>
      <div className="paper-folder" aria-hidden="true">
        <div className="folder-tab" />
        <div className="folder-body" />
      </div>
      <span>{item.label}</span>
      <div className="paper-years" aria-label={`${item.label} previous year papers`}>
        {item.semesters.slice(0, 2).map((semester) => (
          <span key={`${item.label}-${semester.label}`} className="year-pill">
            {semester.label}
          </span>
        ))}
      </div>
    </Link>
  )
}

function CutoffSection() {
  return (
    <section className="cutoff-section" aria-label="AKTU cutoff trends">
      <div className="cutoff-header">
        <div>
          <p className="eyebrow cutoff-eyebrow">AKTU cutoff</p>
          <h2>Year-wise cutoff overview</h2>
        </div>
        <span className="cutoff-badge">B.Tech trends</span>
      </div>

      <div className="cutoff-grid">
        {cutoffData.map((entry) => (
          <article key={`${entry.year}-${entry.branch}`} className="cutoff-card">
            <span className="cutoff-year">{entry.year}</span>
            <strong>{entry.branch}</strong>
            <div className="cutoff-metrics">
              <span>Closing score</span>
              <b>{entry.score}</b>
            </div>
            <div className="cutoff-metrics muted">
              <span>Seats</span>
              <b>{entry.seats}</b>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function QuestionPaperPage({ isDark, setIsDark }) {
  const navigate = useNavigate()

  return (
    <div className={`app-shell ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark((current) => !current)}
        onAskAI={() => navigate('/ai')}
      />

      <main className="question-paper-page">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Question Paper</h1>
            <div className="page-divider" />
          </div>
          <div className="breadcrumb" aria-label="Breadcrumb">
            <span>Home</span>
            <span className="separator">›</span>
            <span>Library</span>
            <span className="separator">›</span>
            <span className="current">Question Paper</span>
          </div>
        </div>

        <CutoffSection />

        <section className="paper-board" aria-label="Question paper categories">
          <div className="paper-grid">
            {questionPaperCategories.map((item) => (
              <QuestionPaperCard key={item.slug} item={item} isDark={isDark} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function QuestionPaperSemesterPage({ isDark, setIsDark }) {
  const navigate = useNavigate()
  const { course } = useParams()
  const selectedCourse = questionPaperCategories.find((item) => item.slug === course) || questionPaperCategories[0]

  return (
    <div className={`app-shell ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark((current) => !current)}
        onAskAI={() => navigate('/ai')}
      />

      <main className="question-paper-page detail-page">
        <div className="page-header-row detail-header-row">
          <div>
            <div className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="separator">›</span>
              <span className="current">{selectedCourse.label}</span>
            </div>
          </div>
        </div>

        <section className="paper-board detail-panel" aria-label={`${selectedCourse.label} semesters`}>
          <div className="semester-grid">
            {selectedCourse.semesters.map((semester) => (
              <Link
                key={`${selectedCourse.slug}-${semester.label}`}
                to={`/resources/${selectedCourse.slug}/${semester.label.replace(/\s+/g, '-').toLowerCase()}`}
                className="semester-card"
              >
                <div className="paper-folder" aria-hidden="true">
                  <div className="folder-tab" />
                  <div className="folder-body" />
                </div>
                <span>{semester.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function QuestionPaperYearPage({ isDark, setIsDark }) {
  const navigate = useNavigate()
  const { course, semester } = useParams()
  const selectedCourse = questionPaperCategories.find((item) => item.slug === course) || questionPaperCategories[0]
  const semesterLabel = semester ? semester.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : '1st Sem.'
  const selectedSemester = selectedCourse.semesters.find((item) => item.label.toLowerCase() === semesterLabel.toLowerCase()) || selectedCourse.semesters[0]

  return (
    <div className={`app-shell ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark((current) => !current)}
        onAskAI={() => navigate('/ai')}
      />

      <main className="question-paper-page detail-page">
        <div className="page-header-row detail-header-row">
          <div>
            <div className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="separator">›</span>
              <Link to={`/resources/${selectedCourse.slug}`}>{selectedCourse.label}</Link>
              <span className="separator">›</span>
              <span className="current">{selectedSemester.label}</span>
            </div>
          </div>
        </div>

        <section className="paper-board detail-panel" aria-label={`${selectedCourse.label} ${selectedSemester.label} papers`}>
          <div className="semester-grid">
            {Object.keys(selectedSemester.years).map((year) => (
              <Link
                key={`${selectedCourse.slug}-${selectedSemester.label}-${year}`}
                to={`/resources/${selectedCourse.slug}/${semester}/${encodeURIComponent(year)}`}
                className="semester-card"
              >
                <div className="paper-folder" aria-hidden="true">
                  <div className="folder-tab" />
                  <div className="folder-body" />
                </div>
                <span>{year}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function QuestionPaperPaperListPage({ isDark, setIsDark }) {
  const navigate = useNavigate()
  const { course, semester, year } = useParams()
  const selectedCourse = questionPaperCategories.find((item) => item.slug === course) || questionPaperCategories[0]
  const normalizedSemester = decodeURIComponent(semester || '').replace(/-/g, ' ')
  const selectedSemester = selectedCourse.semesters.find((item) => item.label.toLowerCase() === normalizedSemester.toLowerCase()) || selectedCourse.semesters[0]
  const selectedYear = decodeURIComponent(year || '2017-18')
  const papers = selectedSemester.years[selectedYear] || []

  return (
    <div className={`app-shell ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark((current) => !current)}
        onAskAI={() => navigate('/ai')}
      />

      <main className="question-paper-page detail-page">
        <div className="page-header-row detail-header-row">
          <div>
            <div className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="separator">›</span>
              <Link to={`/resources/${selectedCourse.slug}`}>{selectedCourse.label}</Link>
              <span className="separator">›</span>
              <Link to={`/resources/${selectedCourse.slug}/${encodeURIComponent(selectedSemester.label.toLowerCase().replace(/\s+/g, '-'))}`}>{selectedSemester.label}</Link>
              <span className="separator">›</span>
              <span className="current">{selectedYear}</span>
            </div>
          </div>
        </div>

        <section className="paper-board detail-panel" aria-label={`${selectedCourse.label} ${selectedSemester.label} ${selectedYear} papers`}>
          <div className="pdf-grid">
            {papers.map((paper) => (
              <a
                key={paper}
                href={selectedCourse.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="pdf-card"
              >
                <div className="pdf-icon" aria-hidden="true">PDF</div>
                <span>{paper}</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function App() {
  const [isDark, setIsDark] = useState(true)

  return (
    <Routes>
      <Route path="/" element={<DashboardPage isDark={isDark} setIsDark={setIsDark} />} />
      <Route path="/ai" element={<AiPage isDark={isDark} setIsDark={setIsDark} />} />
      <Route path="/resources" element={<QuestionPaperPage isDark={isDark} setIsDark={setIsDark} />} />
      <Route path="/resources/:course" element={<QuestionPaperSemesterPage isDark={isDark} setIsDark={setIsDark} />} />
      <Route path="/resources/:course/:semester" element={<QuestionPaperYearPage isDark={isDark} setIsDark={setIsDark} />} />
      <Route path="/resources/:course/:semester/:year" element={<QuestionPaperPaperListPage isDark={isDark} setIsDark={setIsDark} />} />
    </Routes>
  )
}

export default App
