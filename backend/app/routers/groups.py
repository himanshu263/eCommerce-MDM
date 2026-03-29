from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.group import GroupCreate, GroupUpdate, GroupResponse, GroupListResponse
from app.services import group as group_service
from app.services.auth import get_current_user

router = APIRouter(
    prefix="/api/groups",
    tags=["Group Master"],
    dependencies=[Depends(get_current_user)],  # All routes require login
)


@router.get("/", response_model=GroupListResponse, summary="List All Groups")
def list_groups(
    skip:  int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db:    Session = Depends(get_db),
):
    """Fetch all groups with optional pagination."""
    total, groups = group_service.get_all_groups(db, skip=skip, limit=limit)
    return GroupListResponse(total=total, groups=groups)


@router.get("/{group_id}", response_model=GroupResponse, summary="Get Group by ID")
def get_group(group_id: int, db: Session = Depends(get_db)):
    """Fetch a single group by its ID."""
    return group_service.get_group_by_id(db, group_id)


@router.post("/", response_model=GroupResponse, status_code=201, summary="Create Group")
def create_group(payload: GroupCreate, db: Session = Depends(get_db)):
    """Create a new group with permissions."""
    return group_service.create_group(db, payload)


@router.put("/{group_id}", response_model=GroupResponse, summary="Update Group")
def update_group(group_id: int, payload: GroupUpdate, db: Session = Depends(get_db)):
    """Update an existing group. Only provided fields are updated."""
    return group_service.update_group(db, group_id, payload)


@router.delete("/{group_id}", summary="Delete Group")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    """Delete a group. Fails if users are still assigned to it."""
    return group_service.delete_group(db, group_id)
