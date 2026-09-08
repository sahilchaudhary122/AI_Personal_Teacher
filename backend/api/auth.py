from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database.supabase_client import supabase

router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"],
)

class AuthRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(request: AuthRequest):
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        # The Supabase response object might not be directly JSON serializable.
        # Let's see what's in it.
        return response.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(request: AuthRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        return response.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
def refresh_token(request: RefreshRequest):
    try:
        response = supabase.auth.refresh_session(request.refresh_token)
        return response.model_dump()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
