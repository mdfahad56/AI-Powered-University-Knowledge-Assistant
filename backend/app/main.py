from __future__ import annotations

import hashlib
import json
import math
import os
import re
import shutil
import tempfile
import unicodedata
import uuid
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from transformers import pipeline

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

from .database import get_db, init_db
from .models import QuestionPaperResource

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover - optional dependency
    PdfReader = None

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

    def _load_model(self) -> None:
        if self._pipe is not None:
            return

        if os.getenv("ENABLE_AI_MODEL", "false").lower() not in {"1", "true", "yes", "on"}:
            self._pipe = None
            return

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


class EmbeddingService:
    def __init__(self) -> None:
        self._model: Any | None = None

    def _ensure_loaded(self) -> None:
        if self._model is not None:
            return
        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        except Exception:
            self._model = None

    def embed(self, text: str) -> List[float]:
        self._ensure_loaded()
        if self._model is not None:
            try:
                vector = self._model.encode(text, normalize_embeddings=True, convert_to_numpy=True)
                return [float(value) for value in vector.tolist()]
            except Exception:
                pass

        normalized = re.sub(r"[^a-z0-9\s]", " ", text.lower())
        tokens = [token for token in normalized.split() if token]

        if not tokens:
            return [0.0 for _ in range(256)]

        vector = [0.0 for _ in range(256)]
        for token in tokens:
            digest = int(hashlib.md5(token.encode("utf-8")).hexdigest()[:8], 16)
            vector[digest % 256] += 1.0

        norm = math.sqrt(sum(value * value for value in vector))
        if norm == 0:
            return [0.0 for _ in range(256)]

        return [value / norm for value in vector]


def normalize_storage_segment(value: Any, fallback: str = "General") -> str:
    cleaned = str(value or fallback).strip()
    if not cleaned:
        cleaned = fallback
    normalized = re.sub(r"[^A-Za-z0-9]+", "_", cleaned)
    normalized = normalized.strip("_") or fallback
    return normalized


def get_storage_root() -> str:
    if "PYTEST_CURRENT_TEST" in os.environ:
        storage_root = os.path.join(tempfile.gettempdir(), "university_assistant_test_storage")
        shutil.rmtree(storage_root, ignore_errors=True)
        os.makedirs(storage_root, exist_ok=True)
        return storage_root
    return os.path.join(os.path.dirname(__file__), "storage")


def build_question_paper_directory(degree: str, course: str, semester: str, academic_year: str) -> str:
    storage_root = get_storage_root()
    degree_dir = normalize_storage_segment(degree, "General")
    course_dir = normalize_storage_segment(course, "General")
    semester_dir = f"Semester_{normalize_storage_segment(semester, 'Unknown')}"
    year_dir = normalize_storage_segment(academic_year, "Unknown")
    directory = os.path.join(storage_root, "Question_Papers", degree_dir, course_dir, semester_dir, year_dir)
    os.makedirs(directory, exist_ok=True)
    return directory


def find_unique_pdf_path(directory: str, filename: str) -> str:
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", filename or "resource.pdf")
    base_name, extension = os.path.splitext(safe_name)
    candidate = safe_name
    counter = 1
    while os.path.exists(os.path.join(directory, candidate)):
        candidate = f"{base_name}_{counter}{extension}"
        counter += 1
    return os.path.join(directory, candidate)


def normalize_resource_metadata(filename: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(metadata or {})
    document_type = normalized.get("document_type") or normalized.get("type") or "question_paper"
    academic_year = normalized.get("academic_year") or normalized.get("year") or "Unknown"
    degree = normalized.get("degree") or normalized.get("program") or "General"
    course = normalized.get("course") or normalized.get("subject") or "General"

    normalized["document_type"] = document_type
    normalized["degree"] = str(degree)
    normalized["course"] = str(course)
    normalized["academic_year"] = str(academic_year)
    normalized["filename"] = filename

    if "type" not in normalized:
        normalized["type"] = document_type
    if "subject" not in normalized:
        normalized["subject"] = course
    if "year" not in normalized:
        normalized["year"] = academic_year

    return normalized


class ResourceVectorStore:
    def __init__(self, embedding_service: EmbeddingService, storage_dir: str | None = None) -> None:
        self.embedding_service = embedding_service
        self.storage_dir = storage_dir or os.path.join(get_storage_root(), "resources")
        os.makedirs(self.storage_dir, exist_ok=True)
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.chunks: List[Dict[str, Any]] = []

    def add_document(self, filename: str, metadata: Dict[str, Any], chunks: List[str], file_bytes: bytes | None = None) -> Dict[str, Any]:
        resource_id = str(uuid.uuid4())
        normalized_metadata = normalize_resource_metadata(filename, metadata)
        degree_dir = normalize_storage_segment(normalized_metadata.get("degree"), "General")
        course_dir = normalize_storage_segment(normalized_metadata.get("course") or normalized_metadata.get("subject"), "General")
        semester_dir = f"Semester_{normalize_storage_segment(normalized_metadata.get('semester'), 'Unknown')}"
        year_dir = normalize_storage_segment(normalized_metadata.get("academic_year") or normalized_metadata.get("year"), "Unknown")

        resource_dir = os.path.join(self.storage_dir, degree_dir, course_dir, semester_dir, year_dir)
        os.makedirs(resource_dir, exist_ok=True)

        safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", filename or "resource.pdf")
        file_path = os.path.join(resource_dir, safe_name)
        metadata_path = os.path.join(resource_dir, f"{os.path.splitext(safe_name)[0]}_metadata.json")

        if file_bytes is not None:
            with open(file_path, "wb") as handle:
                handle.write(file_bytes)

        with open(metadata_path, "w", encoding="utf-8") as handle:
            json.dump(normalized_metadata, handle, ensure_ascii=False, indent=2)

        self.documents[resource_id] = {
            "id": resource_id,
            "filename": filename,
            "metadata": normalized_metadata,
            "chunks": len(chunks),
            "file_path": file_path,
            "metadata_path": metadata_path,
        }

        for index, chunk in enumerate(chunks):
            self.chunks.append(
                {
                    "id": f"{resource_id}:{index}",
                    "resource_id": resource_id,
                    "filename": filename,
                    "metadata": normalized_metadata,
                    "chunk_index": index,
                    "text": chunk,
                    "embedding": self.embedding_service.embed(chunk),
                }
            )

        return self.documents[resource_id]

    def get_file_path(self, resource_id: str) -> str | None:
        document = self.documents.get(resource_id)
        if not document:
            return None
        return document.get("file_path")

    def list_documents(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": doc_id,
                "filename": document["filename"],
                "metadata": document["metadata"],
                "chunks": document["chunks"],
            }
            for doc_id, document in self.documents.items()
        ]

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            return []

        query_embedding = self.embedding_service.embed(query)
        scored: List[tuple[float, Dict[str, Any]]] = []

        for chunk in self.chunks:
            similarity = self._cosine_similarity(query_embedding, chunk["embedding"])
            if similarity > 0:
                scored.append((similarity, chunk))

        scored.sort(key=lambda item: item[0], reverse=True)
        results: List[Dict[str, Any]] = []

        seen_resources: set[str] = set()
        for similarity, chunk in scored:
            resource_id = chunk["resource_id"]
            if resource_id in seen_resources:
                continue
            seen_resources.add(resource_id)
            results.append(
                {
                    "score": round(float(similarity), 4),
                    "filename": chunk["filename"],
                    "metadata": chunk["metadata"],
                    "text": chunk["text"],
                }
            )
            if len(results) >= top_k:
                break

        return results

    @staticmethod
    def _cosine_similarity(left: List[float], right: List[float]) -> float:
        if len(left) != len(right):
            return 0.0

        dot = sum(a * b for a, b in zip(left, right))
        left_norm = math.sqrt(sum(value * value for value in left))
        right_norm = math.sqrt(sum(value * value for value in right))
        if left_norm == 0 or right_norm == 0:
            return 0.0
        return dot / (left_norm * right_norm)


def clean_text(raw_text: str) -> str:
    cleaned = unicodedata.normalize("NFKC", raw_text)
    cleaned = cleaned.replace("\r", " ")
    cleaned = re.sub(r"[\u0000-\u001F\u007F]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"\s*\n\s*", "\n", cleaned)
    cleaned = cleaned.strip()
    return cleaned


def extract_pdf_text(file_bytes: bytes, filename: str) -> str:
    if PdfReader is not None and filename.lower().endswith(".pdf"):
        try:
            import io

            reader = PdfReader(io.BytesIO(file_bytes))
            pages: List[str] = []
            for page in reader.pages:
                try:
                    text = page.extract_text() or ""
                except Exception:
                    text = ""
                if text:
                    pages.append(text)
            combined = "\n".join(pages)
            if combined:
                return combined
        except Exception:
            pass

    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="ignore")


def chunk_text(text: str, chunk_size: int = 700, overlap: int = 120) -> List[str]:
    cleaned = clean_text(text)
    if not cleaned:
        return []

    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", cleaned) if part.strip()]
    if not sentences:
        return [cleaned]

    chunks: List[str] = []
    current: List[str] = []
    current_length = 0
    overlap_buffer: List[str] = []

    for sentence in sentences:
        sentence_length = len(sentence)
        if current and current_length + sentence_length + 1 > chunk_size:
            chunk_text_value = " ".join(current).strip()
            if chunk_text_value:
                chunks.append(chunk_text_value)
                overlap_buffer = current[-max(1, len(current) // 3):]
            current = list(overlap_buffer)
            current_length = sum(len(part) for part in current)

        current.append(sentence)
        current_length += sentence_length + 1

    if current:
        chunk_text_value = " ".join(current).strip()
        if chunk_text_value:
            chunks.append(chunk_text_value)

    if not chunks:
        return [cleaned[:chunk_size]]

    return chunks


def build_resource_answer(query: str, hits: List[Dict[str, Any]]) -> str:
    if not hits:
        return build_fallback_answer(query)

    best = hits[0]
    source_names = ", ".join(sorted({hit["filename"] for hit in hits}))
    return (
        "Based on the uploaded resource documents, the closest match is: "
        f"{best['text'][:400].strip()} ... "
        f"Relevant source files: {source_names}."
    )


class ChatRequest(BaseModel):

    def generate(self, question: str) -> str:
        if self._pipe is None:
            self._load_model()
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


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    suggested_questions: List[str]


app.state.ai_service = AIChatService()
app.state.resource_store = ResourceVectorStore(EmbeddingService())


@app.on_event("startup")
def startup_event() -> None:
    init_db()
    load_persisted_resources()


def load_persisted_resources() -> None:
    if not hasattr(app.state, "resource_store"):
        app.state.resource_store = ResourceVectorStore(EmbeddingService())

    app.state.resource_store.documents = {}
    app.state.resource_store.chunks = []

    db = next(get_db())
    try:
        resources = db.query(QuestionPaperResource).all()
        for record in resources:
            file_path = os.path.join(get_storage_root(), record.file_path)
            if not os.path.exists(file_path):
                continue

            metadata = {
                "document_type": record.document_type,
                "degree": record.degree,
                "course": record.course,
                "semester": str(record.semester),
                "academic_year": str(record.academic_year),
                "exam_type": record.exam_type,
                "filename": record.filename,
                "resource_id": record.id,
            }
            try:
                with open(file_path, "rb") as source:
                    file_bytes = source.read()
                text = extract_pdf_text(file_bytes, record.filename)
                chunks = chunk_text(text)
                if chunks:
                    app.state.resource_store.add_document(record.filename, metadata, chunks, file_bytes=file_bytes)
            except Exception:
                continue
    finally:
        db.close()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "University Knowledge Assistant API is running."}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "university-knowledge-assistant"}


@app.get("/api/knowledge/areas")
def get_knowledge_areas() -> dict[str, List[str]]:
    return {"areas": KNOWLEDGE_AREAS}


@app.post("/api/chat", response_model=ChatResponse)
def chat_with_assistant(request: ChatRequest) -> ChatResponse:
    query = request.message.strip()

    if not query:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    normalized = query.lower()
    hits = app.state.resource_store.search(query, top_k=3)
    answer = build_resource_answer(query, hits) if hits else app.state.ai_service.generate(query)

    if hits:
        sources = [result["filename"] for result in hits]
        suggested_questions = [
            f"Summarize the key questions from {hits[0]['filename']}",
            "Which topics are most repeated in the uploaded paper?",
            "Give me short notes based on the uploaded material.",
        ]
    elif any(keyword in normalized for keyword in ["graduation", "major", "course", "credit"]):
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


@app.get("/api/resources")
def list_resources(
    degree: str | None = None,
    course: str | None = None,
    semester: str | None = None,
    year: str | None = None,
    db: Session = Depends(get_db),
) -> dict[str, List[Dict[str, Any]]]:
    query = db.query(QuestionPaperResource)
    if degree:
        query = query.filter(QuestionPaperResource.degree == degree)
    if course:
        query = query.filter(QuestionPaperResource.course == course)
    if semester:
        query = query.filter(QuestionPaperResource.semester == int(semester))
    if year:
        query = query.filter(QuestionPaperResource.academic_year == int(year))

    items = query.order_by(QuestionPaperResource.created_at.desc()).all()
    payload = []
    for item in items:
        payload.append(
            {
                "id": item.id,
                "filename": item.filename,
                "metadata": {
                    "document_type": item.document_type,
                    "degree": item.degree,
                    "course": item.course,
                    "semester": str(item.semester),
                    "academic_year": str(item.academic_year),
                    "exam_type": item.exam_type,
                    "filename": item.filename,
                    "resource_id": item.id,
                },
                "file_path": item.file_path,
            }
        )
    return {"items": payload}


@app.post("/api/resources/upload")
def upload_resource(
    file: UploadFile = File(...),
    type: str = Form("question_paper"),
    degree: str = Form("BTech"),
    course: str = Form("DBMS"),
    semester: str = Form("6"),
    year: str = Form("2025"),
    exam_type: str = Form("End Semester"),
    subject: str = Form("DBMS"),
    branch: str = Form("CSE"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="A PDF file is required.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    degree_name = (degree or "General").strip() or "General"
    course_name = (course or subject or "General").strip() or "General"
    semester_value = int(str(semester).strip() or "0")
    academic_year = int(str(year).strip() or "0")

    if semester_value <= 0 or academic_year <= 0:
        raise HTTPException(status_code=400, detail="Semester and academic year are required.")

    file_bytes = file.file.read()
    text = extract_pdf_text(file_bytes, file.filename)
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="The uploaded PDF does not contain readable text.")

    storage_root = get_storage_root()
    target_directory = build_question_paper_directory(degree_name, course_name, str(semester_value), str(academic_year))
    final_file_path = find_unique_pdf_path(target_directory, file.filename)
    final_filename = os.path.basename(final_file_path)
    relative_storage_path = os.path.relpath(final_file_path, storage_root).replace('\\', '/')

    if os.path.exists(final_file_path):
        raise HTTPException(status_code=409, detail="A file with the same name already exists in this hierarchy.")

    with open(final_file_path, "wb") as target:
        target.write(file_bytes)

    metadata = {
        "document_type": type,
        "type": type,
        "degree": degree_name,
        "program": degree_name,
        "course": course_name,
        "subject": course_name,
        "semester": str(semester_value),
        "branch": branch,
        "academic_year": str(academic_year),
        "year": str(academic_year),
        "exam_type": exam_type,
        "filename": final_filename,
    }

    persisted = QuestionPaperResource(
        degree=degree_name,
        course=course_name,
        semester=semester_value,
        academic_year=academic_year,
        exam_type=exam_type,
        filename=final_filename,
        file_path=relative_storage_path,
        document_type=type,
    )
    db.add(persisted)
    db.commit()
    db.refresh(persisted)

    metadata["resource_id"] = persisted.id
    document = app.state.resource_store.add_document(final_filename, metadata, chunks, file_bytes=file_bytes)
    return {
        "id": persisted.id,
        "filename": final_filename,
        "metadata": document["metadata"],
        "chunks": document["chunks"],
        "file_path": relative_storage_path,
    }


@app.get("/api/resources/{resource_id}/file")
def get_resource_file(resource_id: str, db: Session = Depends(get_db)):
    resource = db.query(QuestionPaperResource).filter(QuestionPaperResource.id == int(resource_id)).first()
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found.")

    file_path = os.path.join(get_storage_root(), resource.file_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resource file not found.")

    return FileResponse(
        path=file_path,
        filename=resource.filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{resource.filename}"'},
    )


@app.delete("/api/resources/{resource_id}")
def delete_resource(resource_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    resource = db.query(QuestionPaperResource).filter(QuestionPaperResource.id == int(resource_id)).first()
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found.")

    file_path = os.path.join(get_storage_root(), resource.file_path)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(resource)
    db.commit()

    for chunk in list(app.state.resource_store.chunks):
        if chunk.get("metadata", {}).get("resource_id") == int(resource_id):
            app.state.resource_store.chunks.remove(chunk)

    return {"status": "deleted", "resource_id": resource_id}


@app.get("/api/resources/search")
def search_resources(query: str) -> dict[str, Any]:
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="A search query is required.")

    hits = app.state.resource_store.search(query, top_k=5)
    return {"items": hits}
