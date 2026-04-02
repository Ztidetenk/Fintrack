from collections import defaultdict
from datetime import date
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, extract, func
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.analytics import (
    CategoryBreakdown,
    FinancialSummary,
    MonthlyTotal,
    RecentTransaction,
)
from app.schemas.transaction import TransactionCreate, TransactionFilters, TransactionUpdate


def create_transaction(db: Session, data: TransactionCreate, owner: User) -> Transaction:
    tx = Transaction(**data.model_dump(), owner_id=owner.id)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def get_transaction(db: Session, tx_id: int, owner: User) -> Transaction:
    tx = db.get(Transaction, tx_id)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    # Admins/analysts can see all; viewers only see their own
    if owner.role == "viewer" and tx.owner_id != owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return tx


def list_transactions(
    db: Session,
    owner: User,
    filters: TransactionFilters,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    query = db.query(Transaction)

    # Viewers can only see their own transactions
    if owner.role == "viewer":
        query = query.filter(Transaction.owner_id == owner.id)

    # Apply filters
    if filters.type:
        query = query.filter(Transaction.type == filters.type)
    if filters.category:
        query = query.filter(Transaction.category == filters.category)
    if filters.date_from:
        query = query.filter(Transaction.date >= filters.date_from)
    if filters.date_to:
        query = query.filter(Transaction.date <= filters.date_to)
    if filters.min_amount is not None:
        query = query.filter(Transaction.amount >= filters.min_amount)
    if filters.max_amount is not None:
        query = query.filter(Transaction.amount <= filters.max_amount)

    total = query.count()
    items = (
        query.order_by(Transaction.date.desc(), Transaction.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


def update_transaction(
    db: Session, tx_id: int, data: TransactionUpdate, owner: User
) -> Transaction:
    tx = get_transaction(db, tx_id, owner)

    # Only admin or the owner can update
    if owner.role not in ("admin",) and tx.owner_id != owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(tx, field, value)

    db.commit()
    db.refresh(tx)
    return tx


def delete_transaction(db: Session, tx_id: int, owner: User) -> None:
    tx = get_transaction(db, tx_id, owner)

    if owner.role not in ("admin",) and tx.owner_id != owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    db.delete(tx)
    db.commit()


# ---------------------------------------------------------------------------
# Analytics / summaries
# ---------------------------------------------------------------------------

def get_financial_summary(db: Session, owner: User) -> FinancialSummary:
    query = db.query(Transaction)
    if owner.role == "viewer":
        query = query.filter(Transaction.owner_id == owner.id)

    transactions = query.all()

    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expenses = sum(t.amount for t in transactions if t.type == "expense")
    balance = round(total_income - total_expenses, 2)

    income_count = sum(1 for t in transactions if t.type == "income")
    expense_count = sum(1 for t in transactions if t.type == "expense")

    # Category breakdown
    cat_totals: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expense": 0.0, "count": 0})
    for t in transactions:
        cat_totals[t.category][t.type] += t.amount
        cat_totals[t.category]["count"] += 1

    total_all = total_income + total_expenses or 1  # avoid div/0
    category_breakdown = []
    for cat, data in cat_totals.items():
        cat_total = data["income"] + data["expense"]
        category_breakdown.append(
            CategoryBreakdown(
                category=cat,
                total=round(cat_total, 2),
                count=data["count"],
                percentage=round((cat_total / total_all) * 100, 1),
            )
        )
    category_breakdown.sort(key=lambda x: x.total, reverse=True)

    # Monthly totals
    monthly: dict[tuple, dict] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
    for t in transactions:
        key = (t.date.year, t.date.month)
        monthly[key][t.type] += t.amount

    monthly_totals = [
        MonthlyTotal(
            year=y,
            month=m,
            income=round(v["income"], 2),
            expenses=round(v["expense"], 2),
            net=round(v["income"] - v["expense"], 2),
        )
        for (y, m), v in sorted(monthly.items())
    ]

    # Recent 5 transactions
    recent_raw = sorted(transactions, key=lambda t: (t.date, t.id), reverse=True)[:5]
    recent_transactions = [
        RecentTransaction(
            id=t.id,
            amount=t.amount,
            type=t.type,
            category=t.category,
            date=str(t.date),
            description=t.description,
        )
        for t in recent_raw
    ]

    # Top categories
    income_cats = {c: d["income"] for c, d in cat_totals.items() if d["income"] > 0}
    expense_cats = {c: d["expense"] for c, d in cat_totals.items() if d["expense"] > 0}
    top_income = max(income_cats, key=income_cats.get) if income_cats else None
    top_expense = max(expense_cats, key=expense_cats.get) if expense_cats else None

    return FinancialSummary(
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        balance=balance,
        transaction_count=len(transactions),
        income_count=income_count,
        expense_count=expense_count,
        category_breakdown=category_breakdown,
        monthly_totals=monthly_totals,
        recent_transactions=recent_transactions,
        top_expense_category=top_expense,
        top_income_category=top_income,
    )
