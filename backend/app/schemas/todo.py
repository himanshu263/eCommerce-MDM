from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TodoBase(BaseModel):
    title:       str = Field(..., min_length=1, max_length=100, example="Buy milk")
    description: Optional[str] = Field(None, max_length=255, example="Get semi-skimmed milk")
    completed:   bool = Field(False)


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title:       Optional[str]  = Field(None, min_length=1, max_length=100)
    description: Optional[str]  = Field(None, max_length=255)
    completed:   Optional[bool] = None


class TodoResponse(TodoBase):
    id:         int
    user_id:    int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TodoListResponse(BaseModel):
    total: int
    todos: list[TodoResponse]
