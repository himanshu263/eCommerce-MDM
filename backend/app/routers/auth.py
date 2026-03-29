from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import LoginRequest, TokenResponse, UserInfo
from app.services.auth import authenticate_user, get_current_user
from app.core.security import create_access_token
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, summary="User Login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with username and password.
    Returns a JWT access token valid for 8 hours.
    """
    user = authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user.username})
    logger.info(f"User '{user.username}' logged in successfully.")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserInfo, summary="Get Current User")
def get_me(current_user=Depends(get_current_user)):
    """Returns info about the currently authenticated user."""
    return current_user


@router.post("/logout", summary="Logout")
def logout():
    """
    Logout endpoint — client should discard the token.
    JWT tokens are stateless; invalidation is handled client-side.
    """
    return {"message": "Logged out successfully. Please discard your token."}
