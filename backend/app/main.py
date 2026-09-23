from __future__ import annotations

from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="University Knowledge Assistant API",
    version="0.1.0",
    description="AI-powered university guidance API for student and academic support.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.1.40:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

KNOWLEDGE_AREAS = [
    "Academic policies",
    "Course catalog",
    "Research hubs",
    "Student services",
    "Scholarships",
    "Faculty office hours",
]


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "University Knowledge Assistant API is running."}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "university-knowledge-assistant"}


@app.get("/api/knowledge/areas")
def get_knowledge_areas() -> dict[str, List[str]]:
    return {"areas": KNOWLEDGE_AREAS}


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    suggested_questions: List[str]


@app.post("/api/chat", response_model=ChatResponse)
def chat_with_assistant(request: ChatRequest) -> ChatResponse:
    query = request.message.strip()

    if not query:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    normalized = query.lower()

    if "graduation" in normalized or "major" in normalized or "course" in normalized:
        answer = (
            "To graduate in Computer Science, students typically need to complete the core curriculum, "
            "the major requirements, elective courses, and the minimum GPA threshold set by the faculty. "
            "For most students, this means completing foundational courses first, then advanced specialization modules."
        )
        sources = [
            "Computer Science handbook",
            "Faculty of Science academic policy",
            "2026 course roadmap",
        ]
        suggested_questions = [
            "What electives are recommended for the AI track?",
            "When do students submit graduation forms?",
            "How do I check my degree progress?",
        ]
    elif "scholarship" in normalized or "funding" in normalized:
        answer = (
            "Scholarship deadlines are usually published two months before the start of each semester. "
            "Students are encouraged to apply early, maintain a strong academic record, and submit documentation for financial need or merit-based eligibility."
        )
        sources = [
            "Student financial aid office",
            "Merit scholarship policy",
            "Annual scholarship calendar",
        ]
        suggested_questions = [
            "Which scholarships are available for first-year students?",
            "Do scholarships require a minimum GPA?",
            "Where do I submit my financial aid documents?",
        ]
    elif "exam" in normalized or "timetable" in normalized or "schedule" in normalized:
        answer = (
            "The examination timetable is normally released approximately four weeks before the examination period. "
            "Students should confirm their room allocations and exam rules in the student portal once published."
        )
        sources = [
            "Registrar exam schedule",
            "Student portal announcements",
            "Exam rules handbook",
        ]
        suggested_questions = [
            "When will final exams for Semester 2 be published?",
            "How do I request a rescheduled exam?",
            "What are the rules for online examinations?",
        ]
    else:
        answer = (
            "The university assistant can help with academic policies, course planning, student support, "
            "scholarships, and campus services. Try asking about degree requirements, exam schedules, or student services."
        )
        sources = [
            "University knowledge base",
            "Student services portal",
            "Academic advising center",
        ]
        suggested_questions = [
            "How do I change my major?",
            "What are the advising hours for my faculty?",
            "Where can I find internship opportunities?",
        ]

    return ChatResponse(
        answer=answer,
        sources=sources,
        suggested_questions=suggested_questions,
    )
