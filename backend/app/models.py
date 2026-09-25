from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class QuestionPaperResource(Base):
    __tablename__ = "question_papers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    degree: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    course: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    academic_year: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    exam_type: Mapped[str] = mapped_column(String(255), nullable=False, default="End Semester")
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), unique=True, nullable=False)
    document_type: Mapped[str] = mapped_column(String(128), default="question_paper", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
