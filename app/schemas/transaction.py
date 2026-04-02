from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, field_validator

TransactionType = Literal["income", "expense"]
CategoryType = Literal[
    "salary", "freelance", "investment", "gift",
    "food", "transport", "housing", "health",
    "entertainment", "education", "shopping", "utilities", "other"
]


class TransactionCreate(BaseModel):
    amount: float
    type: TransactionType
    category: CategoryType = "other"
    date: date
    notes: Optional[str] = None
    description: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return round(v, 2)


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[TransactionType] = None
    category: Optional[CategoryType] = None
    date: Optional[date] = None
    notes: Optional[str] = None
    description: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Amount must be greater than zero")
        return round(v, 2) if v is not None else v


class TransactionRead(BaseModel):
    id: int
    amount: float
    type: str
    category: str
    date: date
    notes: Optional[str]
    description: Optional[str]
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TransactionFilters(BaseModel):
    type: Optional[TransactionType] = None
    category: Optional[CategoryType] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
