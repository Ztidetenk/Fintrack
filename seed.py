"""
Seed script - populates the database with realistic demo data.
Run with: python seed.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta
import random

from app.core.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.transaction import Transaction
from app.core.security import hash_password

# ---------------------------------------------------------------------------
# Demo users
# ---------------------------------------------------------------------------

USERS = [
    {
        "email": "admin@fintrack.dev",
        "username": "admin",
        "password": "admin123",
        "role": "admin",
    },
    {
        "email": "analyst@fintrack.dev",
        "username": "analyst",
        "password": "analyst123",
        "role": "analyst",
    },
    {
        "email": "viewer@fintrack.dev",
        "username": "viewer",
        "password": "viewer123",
        "role": "viewer",
    },
]

# ---------------------------------------------------------------------------
# Transaction templates (realistic patterns)
# ---------------------------------------------------------------------------

INCOME_TEMPLATES = [
    {"category": "salary",     "amount_range": (3000, 4500), "description": "Monthly salary"},
    {"category": "freelance",  "amount_range": (200, 1200),  "description": "Freelance project"},
    {"category": "investment", "amount_range": (50, 500),    "description": "Dividend payout"},
    {"category": "gift",       "amount_range": (20, 200),    "description": "Gift received"},
]

EXPENSE_TEMPLATES = [
    {"category": "housing",       "amount_range": (800, 1200), "description": "Monthly rent"},
    {"category": "food",          "amount_range": (15, 120),   "description": "Groceries / dining"},
    {"category": "transport",     "amount_range": (20, 150),   "description": "Transport / fuel"},
    {"category": "utilities",     "amount_range": (40, 120),   "description": "Electricity / internet"},
    {"category": "health",        "amount_range": (30, 300),   "description": "Pharmacy / checkup"},
    {"category": "entertainment", "amount_range": (10, 80),    "description": "Streaming / outings"},
    {"category": "shopping",      "amount_range": (30, 250),   "description": "Clothing / gadgets"},
    {"category": "education",     "amount_range": (50, 400),   "description": "Course / books"},
]


def random_date_in_last_n_months(n: int) -> date:
    today = date.today()
    days_back = random.randint(0, n * 30)
    return today - timedelta(days=days_back)


def generate_transactions(owner_id: int, count: int) -> list[dict]:
    records = []
    for _ in range(count):
        is_income = random.random() < 0.35  # ~35% income, ~65% expense
        templates = INCOME_TEMPLATES if is_income else EXPENSE_TEMPLATES
        t = random.choice(templates)
        low, high = t["amount_range"]
        records.append(
            {
                "amount": round(random.uniform(low, high), 2),
                "type": "income" if is_income else "expense",
                "category": t["category"],
                "date": random_date_in_last_n_months(6),
                "description": t["description"],
                "notes": None,
                "owner_id": owner_id,
            }
        )
    return records


def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding users...")
        user_objs = []
        for u in USERS:
            user = User(
                email=u["email"],
                username=u["username"],
                hashed_password=hash_password(u["password"]),
                role=u["role"],
            )
            db.add(user)
            user_objs.append(user)

        db.commit()
        for u in user_objs:
            db.refresh(u)

        print("Seeding transactions...")
        all_transactions = []
        # Admin gets the most data (good for summary/analytics demo)
        for user, count in zip(user_objs, [60, 30, 15]):
            txs = generate_transactions(user.id, count)
            for tx_data in txs:
                all_transactions.append(Transaction(**tx_data))

        db.add_all(all_transactions)
        db.commit()

        print("\nSeed complete!")
        print("=" * 40)
        print("Demo credentials:")
        for u in USERS:
            print(f"  {u['role']:10s}  {u['email']}  /  {u['password']}")
        print("=" * 40)
        print(f"Transactions created: {len(all_transactions)}")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
