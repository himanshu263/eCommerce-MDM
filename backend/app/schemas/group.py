from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class PermissionsSchema(BaseModel):
    """Defines what actions a group is allowed to perform."""
    can_view:   bool = True
    can_create: bool = False
    can_edit:   bool = False
    can_delete: bool = False
    can_export: bool = False


class GroupBase(BaseModel):
    group_name:  str = Field(..., min_length=2, max_length=100, example="Administrators")
    group_code:  str = Field(..., min_length=2, max_length=20, example="ADMIN")
    description: Optional[str] = Field(None, example="Full access group")
    is_active:   bool = Field(True)
    permissions: Optional[PermissionsSchema] = Field(default_factory=PermissionsSchema)


class GroupCreate(GroupBase):
    """Schema for creating a new group."""
    pass


class GroupUpdate(BaseModel):
    """Schema for updating an existing group — all fields optional."""
    group_name:  Optional[str] = Field(None, min_length=2, max_length=100)
    group_code:  Optional[str] = Field(None, min_length=2, max_length=20)
    description: Optional[str] = None
    is_active:   Optional[bool] = None
    permissions: Optional[PermissionsSchema] = None


class GroupResponse(GroupBase):
    """Schema returned in API responses."""
    id:         int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GroupListResponse(BaseModel):
    """Paginated list of groups."""
    total:  int
    groups: list[GroupResponse]
