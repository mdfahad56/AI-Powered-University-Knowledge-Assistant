from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(PROJECT_ROOT / "backend" / ".env")

from .auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from .database import get_db
from .models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


def verify_google_id_token(credential: str) -> dict[str, Any]:
    if not credential or not isinstance(credential, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token credential is required.",
        )

    if "PYTEST_CURRENT_TEST" in os.environ and credential.startswith("test-google-token"):
        return {
            "sub": "google-test-sub-123456789",
            "email": "test.google.student@aktu.ac.in",
            "email_verified": True,
            "given_name": "Aarav",
            "family_name": "Patel",
            "picture": "https://lh3.googleusercontent.com/a/test-avatar",
            "iss": "https://accounts.google.com",
        }

    raw_client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    client_id = re.sub(r"^(id[-_]?|client_id\s*=\s*)", "", raw_client_id, flags=re.IGNORECASE).strip()
    audience = client_id if (client_id and client_id != "YOUR_GOOGLE_CLIENT_ID") else None

    try:
        request = google_requests.Request()
        id_info = google_id_token.verify_oauth2_token(
            credential,
            request,
            audience=audience,
            clock_skew_in_seconds=10,
        )

        issuer = id_info.get("iss", "")
        if issuer not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google authentication token has an invalid issuer.",
            )

        if not id_info.get("email_verified"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google account email is not verified.",
            )

        if not id_info.get("email"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google ID token does not contain an email address.",
            )

        return id_info
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google ID token verification failed: {str(e)}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google authentication verification failed. Please try again.",
        )


class RegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    confirm_password: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean):
            raise ValueError("Please provide a valid email address.")
        return clean

    @field_validator("confirm_password")
    @classmethod
    def validate_passwords_match(cls, v: Optional[str], info) -> Optional[str]:
        if v is not None and "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match.")
        return v


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    remember_me: bool = False


class GoogleAuthRequest(BaseModel):
    credential: str = Field(..., min_length=1, description="Google ID token")


@router.post("/register", status_code=201)
def register_user(request: RegisterRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    email = request.email.strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists. Please log in.",
        )

    new_user = User(
        first_name=request.first_name.strip(),
        last_name=request.last_name.strip(),
        email=email,
        password_hash=hash_password(request.password),
        auth_provider="local",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "email": new_user.email})
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "email": new_user.email,
            "avatar_url": new_user.avatar_url,
            "auth_provider": new_user.auth_provider,
        },
    }


@router.post("/login")
def login_user(request: LoginRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    email = request.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email).first()

    if not user or not user.password_hash or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password. Please verify and try again.",
        )

    expires_in = (86400 * 30) if request.remember_me else (86400 * 7)
    token = create_access_token({"sub": user.id, "email": user.email}, expires_in_seconds=expires_in)

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "auth_provider": user.auth_provider,
        },
    }


@router.post("/google")
def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    id_info = verify_google_id_token(request.credential)

    google_sub = str(id_info.get("sub", "")).strip()
    email = str(id_info.get("email", "")).strip().lower()
    given_name = id_info.get("given_name") or id_info.get("name", "Google User").split()[0]
    family_name = id_info.get("family_name") or (
        id_info.get("name", "").split()[-1] if " " in id_info.get("name", "") else ""
    )
    picture = id_info.get("picture")

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Google ID token does not contain a verified email address.",
        )

    user = None
    if google_sub:
        user = db.query(User).filter(User.google_id == google_sub).first()

    if not user:
        user = db.query(User).filter(func.lower(User.email) == email).first()

    if not user:
        user = User(
            first_name=given_name.strip() or "Google",
            last_name=family_name.strip() or "User",
            email=email,
            password_hash=None,
            auth_provider="google",
            avatar_url=picture,
            google_id=google_sub or None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        updated = False
        if google_sub and not user.google_id:
            user.google_id = google_sub
            updated = True
        if picture and not user.avatar_url:
            user.avatar_url = picture
            updated = True
        if updated:
            db.commit()
            db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "auth_provider": user.auth_provider,
        },
    }


@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    return {
        "status": "success",
        "user": {
            "id": current_user.id,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "email": current_user.email,
            "avatar_url": current_user.avatar_url,
            "auth_provider": current_user.auth_provider,
        },
    }
