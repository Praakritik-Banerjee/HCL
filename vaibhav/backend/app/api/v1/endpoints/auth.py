import uuid
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.common import ResponseEnvelope
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, UserAuthResponse

router = APIRouter()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

@router.post("/register", response_model=ResponseEnvelope[UserAuthResponse], status_code=status.HTTP_201_CREATED)
def register_user(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new student account in PostgreSQL."""
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        id=str(uuid.uuid4()),
        email=request.email,
        full_name=request.full_name,
        hashed_password=hash_password(request.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    auth_data = UserAuthResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name or user.email.split("@")[0],
        learner_id=user.id,
        access_token=f"token_{user.id}",
    )
    return ResponseEnvelope[UserAuthResponse](
        success=True,
        data=auth_data,
        message="Registration successful! Welcome to PadhaiMate."
    )

@router.post("/login", response_model=ResponseEnvelope[UserAuthResponse])
def login_user(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password."""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or user.hashed_password != hash_password(request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    auth_data = UserAuthResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name or user.email.split("@")[0],
        learner_id=user.id,
        access_token=f"token_{user.id}",
    )
    return ResponseEnvelope[UserAuthResponse](
        success=True,
        data=auth_data,
        message="Login successful."
    )
