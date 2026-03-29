from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.group import Group
from app.schemas.group import GroupCreate, GroupUpdate
import logging

logger = logging.getLogger(__name__)


def get_all_groups(db: Session, skip: int = 0, limit: int = 100) -> tuple[int, list[Group]]:
    """Fetch all groups with pagination. Returns (total_count, groups)."""
    query = db.query(Group)
    total = query.count()
    groups = query.order_by(Group.group_name).offset(skip).limit(limit).all()
    return total, groups


def get_group_by_id(db: Session, group_id: int) -> Group:
    """Fetch a single group by ID. Raises 404 if not found."""
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {group_id} not found."
        )
    return group


def create_group(db: Session, payload: GroupCreate) -> Group:
    """
    Create a new group record.

    Raises:
        HTTPException 400: If group_code already exists.
    """
    group = Group(
        group_name  = payload.group_name,
        group_code  = payload.group_code.upper().strip(),
        description = payload.description,
        is_active   = payload.is_active,
        permissions = payload.permissions.model_dump() if payload.permissions else {},
    )
    try:
        db.add(group)
        db.commit()
        db.refresh(group)
        logger.info(f"Group created: {group.group_code}")
        return group
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Group code '{payload.group_code.upper()}' already exists."
        )


def update_group(db: Session, group_id: int, payload: GroupUpdate) -> Group:
    """
    Update an existing group. Only updates fields that are provided.

    Raises:
        HTTPException 404: If group not found.
        HTTPException 400: If new group_code already exists.
    """
    group = get_group_by_id(db, group_id)

    update_data = payload.model_dump(exclude_unset=True)

    # Normalize group_code to uppercase
    if "group_code" in update_data:
        update_data["group_code"] = update_data["group_code"].upper().strip()

    # Serialize permissions if provided
    if "permissions" in update_data and update_data["permissions"]:
        update_data["permissions"] = update_data["permissions"].model_dump() \
            if hasattr(update_data["permissions"], "model_dump") \
            else update_data["permissions"]

    for field, value in update_data.items():
        setattr(group, field, value)

    try:
        db.commit()
        db.refresh(group)
        logger.info(f"Group updated: {group.group_code}")
        return group
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group code already exists."
        )


def delete_group(db: Session, group_id: int) -> dict:
    """
    Delete a group by ID.

    Raises:
        HTTPException 404: If group not found.
        HTTPException 400: If group has active users assigned.
    """
    group = get_group_by_id(db, group_id)

    # Safety check — don't delete groups that have users
    if group.users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete group '{group.group_name}' — it has {len(group.users)} user(s) assigned."
        )

    db.delete(group)
    db.commit()
    logger.info(f"Group deleted: {group.group_code}")
    return {"message": f"Group '{group.group_name}' deleted successfully."}
