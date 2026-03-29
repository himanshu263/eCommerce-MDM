from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.user import User
from app.models.group import Group
from app.schemas.user import UserCreate, UserUpdate, PasswordChange, UserResponse
from app.core.security import hash_password
import logging

logger = logging.getLogger(__name__)


def _to_response(user: User) -> UserResponse:
    """Convert ORM User to UserResponse (with joined group_name)."""
    return UserResponse(
        id         = user.id,
        username   = user.username,
        email      = user.email,
        full_name  = user.full_name,
        group_id   = user.group_id,
        group_name = user.group.group_name if user.group else None,
        is_active  = user.is_active,
        created_at = user.created_at,
        updated_at = user.updated_at,
    )


def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> tuple[int, list[UserResponse]]:
    """Fetch all users with group info. Returns (total_count, users)."""
    query = db.query(User).options(joinedload(User.group))
    total = query.count()
    users = query.order_by(User.username).offset(skip).limit(limit).all()
    return total, [_to_response(u) for u in users]


def get_user_by_id(db: Session, user_id: int) -> UserResponse:
    """Fetch a single user by ID. Raises 404 if not found."""
    user = db.query(User).options(joinedload(User.group)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
    return _to_response(user)


def create_user(db: Session, payload: UserCreate) -> UserResponse:
    """
    Create a new user.

    Raises:
        HTTPException 400: If username or email already exists.
        HTTPException 404: If group_id provided but group not found.
    """
    # Validate group exists if provided
    if payload.group_id:
        group = db.query(Group).filter(Group.id == payload.group_id, Group.is_active == True).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Active group with ID {payload.group_id} not found."
            )

    user = User(
        username        = payload.username.strip(),
        email           = payload.email.strip().lower(),
        hashed_password = hash_password(payload.password),
        full_name       = payload.full_name.strip() if payload.full_name else None,
        group_id        = payload.group_id,
        is_active       = payload.is_active,
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"User created: {user.username}")
        return get_user_by_id(db, user.id)
    except IntegrityError as e:
        db.rollback()
        err = str(e.orig)
        if "username" in err:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Username '{payload.username}' is already taken.")
        if "email" in err:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Email '{payload.email}' is already registered.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="User could not be created due to a conflict.")


def update_user(db: Session, user_id: int, payload: UserUpdate) -> UserResponse:
    """
    Update an existing user. Only updates fields that are provided.

    Raises:
        HTTPException 404: If user not found.
        HTTPException 400: If username/email already taken.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"User with ID {user_id} not found.")

    update_data = payload.model_dump(exclude_unset=True)

    # Validate group if being changed
    if "group_id" in update_data and update_data["group_id"] is not None:
        group = db.query(Group).filter(Group.id == update_data["group_id"], Group.is_active == True).first()
        if not group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail=f"Active group with ID {update_data['group_id']} not found.")

    if "username" in update_data and update_data["username"]:
        update_data["username"] = update_data["username"].strip()
    if "email" in update_data and update_data["email"]:
        update_data["email"] = update_data["email"].strip().lower()
    if "full_name" in update_data and update_data["full_name"]:
        update_data["full_name"] = update_data["full_name"].strip()

    for field, value in update_data.items():
        setattr(user, field, value)

    try:
        db.commit()
        db.refresh(user)
        logger.info(f"User updated: {user.username}")
        return get_user_by_id(db, user.id)
    except IntegrityError as e:
        db.rollback()
        err = str(e.orig)
        if "username" in err:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Username is already taken.")
        if "email" in err:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Email is already registered.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Update failed due to a conflict.")


def change_password(db: Session, user_id: int, payload: PasswordChange) -> dict:
    """
    Change a user's password (admin action — no old password required).

    Raises:
        HTTPException 404: If user not found.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"User with ID {user_id} not found.")

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    logger.info(f"Password changed for user: {user.username}")
    return {"message": f"Password updated for '{user.username}'."}


def delete_user(db: Session, user_id: int) -> dict:
    """
    Delete a user by ID.

    Raises:
        HTTPException 404: If user not found.
        HTTPException 400: If trying to delete the last active admin.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"User with ID {user_id} not found.")

    username = user.username
    db.delete(user)
    db.commit()
    logger.info(f"User deleted: {username}")
    return {"message": f"User '{username}' deleted successfully."}
