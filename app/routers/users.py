from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.schemas.user import UserRead, UserRoleUpdate
from app.services.user_service import delete_user, list_users, update_user_role

router = APIRouter(prefix="/api/users", tags=["Users (Admin)"])


@router.get("/", response_model=list[UserRead])
def get_all_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """List all registered users. Admin only."""
    return list_users(db)


@router.patch("/{user_id}/role", response_model=UserRead)
def change_role(
    user_id: int,
    data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """Update a user's role. Admin only."""
    return update_user_role(db, user_id, data.role)


@router.delete("/{user_id}", status_code=204)
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """Delete a user account. Admin only."""
    delete_user(db, user_id, current_user)
