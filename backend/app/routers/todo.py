from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.todo import TodoCreate, TodoUpdate, TodoResponse, TodoListResponse
from app.services import todo as todo_service
from app.services.auth import get_current_user
from app.schemas.user import UserInfo

router = APIRouter(
    prefix="/api/todos",
    tags=["Todos"],
    dependencies=[Depends(get_current_user)],  # All routes require login
)


@router.get("/", response_model=TodoListResponse, summary="List All Todos")
def list_todos(
    skip:  int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db:    Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    """Fetch all todos for the current user."""
    total, todos = todo_service.get_all_todos(db, current_user.id, skip=skip, limit=limit)
    return TodoListResponse(total=total, todos=todos)


@router.get("/{todo_id}", response_model=TodoResponse, summary="Get Todo by ID")
def get_todo(
    todo_id: int, 
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    """Fetch a single todo by ID."""
    return todo_service.get_todo_by_id(db, todo_id, current_user.id)


@router.post("/", response_model=TodoResponse, status_code=201, summary="Create Todo")
def create_todo(
    payload: TodoCreate, 
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    """Create a new todo item."""
    return todo_service.create_todo(db, current_user.id, payload)


@router.put("/{todo_id}", response_model=TodoResponse, summary="Update Todo")
def update_todo(
    todo_id: int, 
    payload: TodoUpdate, 
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    """Update an existing todo."""
    return todo_service.update_todo(db, todo_id, current_user.id, payload)


@router.delete("/{todo_id}", summary="Delete Todo")
def delete_todo(
    todo_id: int, 
    db: Session = Depends(get_db),
    current_user: UserInfo = Depends(get_current_user),
):
    """Permanently delete a todo item."""
    return todo_service.delete_todo(db, todo_id, current_user.id)
