from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.todo import Todo
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse
import logging

logger = logging.getLogger(__name__)


def get_all_todos(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> tuple[int, list[Todo]]:
    """Fetch all todos for a specific user."""
    query = db.query(Todo).filter(Todo.user_id == user_id)
    total = query.count()
    todos = query.order_by(Todo.created_at.desc()).offset(skip).limit(limit).all()
    return total, todos


def get_todo_by_id(db: Session, todo_id: int, user_id: int) -> Todo:
    """Fetch a single todo by ID and user_id."""
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Todo with ID {todo_id} not found."
        )
    return todo


def create_todo(db: Session, user_id: int, payload: TodoCreate) -> Todo:
    """Create a new todo for a user."""
    todo = Todo(
        title       = payload.title.strip(),
        description = payload.description.strip() if payload.description else None,
        completed   = payload.completed,
        user_id     = user_id,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    logger.info(f"Todo created: {todo.title} for user {user_id}")
    return todo


def update_todo(db: Session, todo_id: int, user_id: int, payload: TodoUpdate) -> Todo:
    """Update an existing todo."""
    todo = get_todo_by_id(db, todo_id, user_id)
    
    update_data = payload.model_dump(exclude_unset=True)
    if "title" in update_data and update_data["title"]:
        update_data["title"] = update_data["title"].strip()
    if "description" in update_data and update_data["description"]:
        update_data["description"] = update_data["description"].strip()

    for field, value in update_data.items():
        setattr(todo, field, value)

    db.commit()
    db.refresh(todo)
    logger.info(f"Todo updated: {todo.title} for user {user_id}")
    return todo


def delete_todo(db: Session, todo_id: int, user_id: int) -> dict:
    """Delete a todo by ID."""
    todo = get_todo_by_id(db, todo_id, user_id)
    db.delete(todo)
    db.commit()
    logger.info(f"Todo deleted: {todo_id} for user {user_id}")
    return {"message": "Todo deleted successfully."}
