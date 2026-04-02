from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.analytics import FinancialSummary
from app.schemas.transaction import (
    TransactionCreate,
    TransactionFilters,
    TransactionRead,
    TransactionUpdate,
)
from app.services.transaction_service import (
    create_transaction,
    delete_transaction,
    get_financial_summary,
    get_transaction,
    list_transactions,
    update_transaction,
)

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.post("/", response_model=TransactionRead, status_code=201)
def create(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("analyst", "admin")),
):
    """Create a new transaction. Requires analyst or admin role."""
    return create_transaction(db, data, current_user)


@router.get("/", response_model=dict)
def list_all(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    type: Optional[str] = Query(None, description="Filter by type: income or expense"),
    category: Optional[str] = Query(None, description="Filter by category"),
    date_from: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    min_amount: Optional[float] = Query(None, description="Minimum amount"),
    max_amount: Optional[float] = Query(None, description="Maximum amount"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    List transactions with optional filters and pagination.
    - Viewers see only their own transactions.
    - Analysts and admins see all transactions.
    """
    filters = TransactionFilters(
        type=type,
        category=category,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
    )
    result = list_transactions(db, current_user, filters, page, page_size)
    result["items"] = [TransactionRead.model_validate(tx) for tx in result["items"]]
    return result


@router.get("/summary", response_model=FinancialSummary)
def summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get a full financial summary with totals, category breakdown, and monthly trends.
    - Viewers see summary for their own data only.
    - Analysts and admins see the global summary.
    """
    return get_financial_summary(db, current_user)


@router.get("/{tx_id}", response_model=TransactionRead)
def get_one(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retrieve a single transaction by ID."""
    return get_transaction(db, tx_id, current_user)


@router.patch("/{tx_id}", response_model=TransactionRead)
def update(
    tx_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("analyst", "admin")),
):
    """Update a transaction. Analysts can update their own; admins can update any."""
    return update_transaction(db, tx_id, data, current_user)


@router.delete("/{tx_id}", status_code=204)
def delete(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """Delete a transaction. Admin only."""
    delete_transaction(db, tx_id, current_user)
