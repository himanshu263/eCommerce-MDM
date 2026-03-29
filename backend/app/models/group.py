from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Group(Base):
    """
    Group master table.
    Stores user groups with permissions and access control.
    """
    __tablename__ = "groups"

    id          = Column(Integer, primary_key=True, index=True)
    group_name  = Column(String(100), nullable=False)
    group_code  = Column(String(20), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active   = Column(Boolean, default=True, nullable=False)
    permissions = Column(JSONB, nullable=True, default=dict)  # e.g. {"can_view": true, "can_edit": false}
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship back to users
    users = relationship("User", back_populates="group")

    def __repr__(self) -> str:
        return f"<Group(code={self.group_code}, name={self.group_name})>"
