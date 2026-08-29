from fastapi import Header, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, PlacementTeamMember
from typing import Optional, List

def get_current_user(
    x_user_email: Optional[str] = Header(None),
    x_user_id: Optional[int] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Identifies the authenticated user from the request header.
    Validates user existence and active status in the database.
    """
    user = None
    if x_user_email:
        user = db.query(User).filter(User.email == x_user_email.strip().lower()).first()
    elif x_user_id:
        user = db.query(User).filter(User.id == x_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide valid user credentials in header (X-User-Email)."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact Administrator."
        )

    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{current_user.role}' does not have permission for this action. Allowed: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

require_admin = require_roles(["admin"])
require_manager_or_admin = require_roles(["admin", "manager"])
require_team_member_or_admin = require_roles(["admin", "team_member"])
require_team_member = require_roles(["team_member"])
