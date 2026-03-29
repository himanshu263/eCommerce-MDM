from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Todo(Base):
    """
    Todo table.
    Stores todo items for users.
    """
    __tablename__ = "todos"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=True)
    completed   = Column(Boolean, default=False, nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<Todo(title={self.title}, completed={self.completed})>"
