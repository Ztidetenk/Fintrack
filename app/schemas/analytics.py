from typing import Dict, List

from pydantic import BaseModel


class CategoryBreakdown(BaseModel):
    category: str
    total: float
    count: int
    percentage: float


class MonthlyTotal(BaseModel):
    year: int
    month: int
    income: float
    expenses: float
    net: float


class RecentTransaction(BaseModel):
    id: int
    amount: float
    type: str
    category: str
    date: str
    description: str | None


class FinancialSummary(BaseModel):
    total_income: float
    total_expenses: float
    balance: float
    transaction_count: int
    income_count: int
    expense_count: int
    category_breakdown: List[CategoryBreakdown]
    monthly_totals: List[MonthlyTotal]
    recent_transactions: List[RecentTransaction]
    top_expense_category: str | None
    top_income_category: str | None
