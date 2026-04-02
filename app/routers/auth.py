from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.user import TokenResponse, UserCreate, UserRead
from app.services.user_service import create_user, login_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=UserRead, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    return create_user(db, data)


@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with email and password. Returns a JWT access token."""
    # OAuth2PasswordRequestForm uses `username` field - we treat it as email
    return login_user(db, email=form.username, password=form.password)


@router.get("/me", response_model=UserRead)
def me(current_user=Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user
