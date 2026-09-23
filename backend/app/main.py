from __future__ import annotations

import os
from typing import Any, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import pipeline

from dotenv import load_dotenv
load_dotenv()
app = FastAPI(
    title="University Knowledge Assistant API",
    version="0.1.0",
    description="AI-powered university guidance API for student and academic support.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.1\.40)(:\d+)?$",
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.1.40:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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


def build_fallback_answer(question: str) -> str:
    normalized = question.lower()

    if any(keyword in normalized for keyword in ["graduation", "major", "course", "credit"]):
        return (
            "For most university degree programs, graduation requires completing the core curriculum, "
            "major-specific requirements, and the minimum GPA threshold. Students should also confirm their "
            "elective and credit-hour requirements with the academic adviser or faculty handbook."
        )
    if any(keyword in normalized for keyword in ["scholarship", "funding", "financial aid"]):
        return (
            "Scholarships usually have eligibility rules based on academic performance, financial need, or specific student categories. "
            "Students should check application deadlines early, submit required documents, and verify whether a minimum GPA is required."
        )
    if any(keyword in normalized for keyword in ["exam", "schedule", "timetable"]):
        return (
            "Examination timetables are typically released several weeks before the exam period. Students should check the official portal, "
            "confirm room allocations, and review academic integrity and exam conduct rules before the assessment date."
        )

    return (
        "The university assistant can help with academic advising, course planning, scholarship information, student services, "
        "and campus resources. Please ask about graduation requirements, scholarships, exams, or faculty support services."
    )


class AIChatService:
    def __init__(self) -> None:
        self._pipe: Any | None = None
        self._load_model()

    def _load_model(self) -> None:
        model_name = os.getenv("HF_MODEL_NAME", "microsoft/Phi-3.5-mini-instruct")
        token = os.getenv("HF_TOKEN")

        try:
            self._pipe = pipeline(
                "text-generation",
                model=model_name,
                token=token,
                device=-1,
            )
        except Exception:
            self._pipe = None

    def generate(self, question: str) -> str:
        if self._pipe is None:
            return build_fallback_answer(question)

        try:
            result = self._pipe(
                question,
                max_new_tokens=220,
                do_sample=True,
                temperature=0.2,
                truncation=True,
            )
            if not result:
                return build_fallback_answer(question)
            generated = result[0].get("generated_text", "")
            cleaned = str(generated).strip()
            return cleaned or build_fallback_answer(question)
        except Exception:
            return build_fallback_answer(question)


app.state.ai_service = AIChatService()


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
    answer = app.state.ai_service.generate(query)

    if any(keyword in normalized for keyword in ["graduation", "major", "course", "credit"]):
        sources = [
            "Faculty handbook",
            "Program requirements catalog",
            "Academic advising office",
        ]
        suggested_questions = [
            "What electives are recommended for the AI track?",
            "When do students submit graduation forms?",
            "How can I check my degree progress?",
        ]
    elif any(keyword in normalized for keyword in ["scholarship", "funding", "financial aid"]):
        sources = [
            "Student financial aid office",
            "Scholarship policy guide",
            "Annual aid calendar",
        ]
        suggested_questions = [
            "Which scholarships are available for first-year students?",
            "Do scholarships require a minimum GPA?",
            "Where do I submit financial aid documents?",
        ]
    elif any(keyword in normalized for keyword in ["exam", "schedule", "timetable"]):
        sources = [
            "Registrar exam schedule",
            "Student portal announcements",
            "Academic regulations",
        ]
        suggested_questions = [
            "When will final exams for Semester 2 be released?",
            "How do I request a rescheduled exam?",
            "What are the online exam rules?",
        ]
    else:
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
