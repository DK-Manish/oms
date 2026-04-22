from datetime import datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Orders ────────────────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=100)
    item: str = Field(..., min_length=1, max_length=200)
    quantity: int = Field(..., gt=0)
    price: Decimal = Field(..., gt=0, decimal_places=2)


class StatusUpdate(BaseModel):
    status: Literal["pending", "processing", "shipped", "delivered", "cancelled"]


class OrderResponse(BaseModel):
    id: int
    customer_name: str
    item: str
    quantity: int
    price: Decimal
    status: str
    created_at: datetime
    created_by: UserResponse

    model_config = {"from_attributes": True}


class PaginatedOrders(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    pages: int
    limit: int
