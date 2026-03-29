from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserUpdate, PasswordChange, UserResponse, UserListResponse
from app.services import user as user_service
from app.services.auth import get_current_user

router = APIRouter(
    prefix="/api/users",
    tags=["User Master"],
    dependencies=[Depends(get_current_user)],  # All routes require login
)


@router.get("/", response_model=UserListResponse, summary="List All Users")
def list_users(
    skip:  int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db:    Session = Depends(get_db),
):
    """Fetch all users with optional pagination. Includes group name."""
    total, users = user_service.get_all_users(db, skip=skip, limit=limit)
    return UserListResponse(total=total, users=users)


@router.get("/{user_id}", response_model=UserResponse, summary="Get User by ID")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Fetch a single user by their ID."""
    return user_service.get_user_by_id(db, user_id)


@router.post("/", response_model=UserResponse, status_code=201, summary="Create User")
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account."""
    return user_service.create_user(db, payload)


@router.put("/{user_id}", response_model=UserResponse, summary="Update User")
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    """Update an existing user. Only provided fields are updated."""
    return user_service.update_user(db, user_id, payload)


@router.patch("/{user_id}/password", summary="Change User Password")
def change_password(user_id: int, payload: PasswordChange, db: Session = Depends(get_db)):
    """Admin action — change a user's password without needing the old one."""
    return user_service.change_password(db, user_id, payload)


@router.delete("/{user_id}", summary="Delete User")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Permanently delete a user account."""
    return user_service.delete_user(db, user_id)
