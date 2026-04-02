# FinTrack — Python Finance Tracking API

A clean, role-based finance tracking backend built with **FastAPI**, **SQLAlchemy**, and **SQLite**.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | FastAPI | Async-ready, automatic OpenAPI docs, Pydantic-native |
| ORM | SQLAlchemy 2.0 | Pythonic, type-safe mapped columns |
| Database | SQLite | Zero-config, file-based, perfect for assessment scope |
| Auth | JWT (python-jose) + bcrypt | Stateless, industry-standard |
| Validation | Pydantic v2 | Schema-first, great error messages |

---

## Project Structure

```
fintrack/
├── app/
│   ├── core/
│   │   ├── config.py        # Settings via pydantic-settings
│   │   ├── database.py      # SQLAlchemy engine, session, Base
│   │   └── security.py      # JWT creation, password hashing, role guards
│   ├── models/
│   │   ├── user.py          # User ORM model (id, email, username, role)
│   │   └── transaction.py   # Transaction ORM model
│   ├── schemas/
│   │   ├── user.py          # UserCreate, UserRead, TokenResponse
│   │   ├── transaction.py   # TransactionCreate/Update/Read, Filters
│   │   └── analytics.py     # FinancialSummary, CategoryBreakdown, MonthlyTotal
│   ├── routers/
│   │   ├── auth.py          # /api/auth — register, login, me
│   │   ├── transactions.py  # /api/transactions — CRUD + summary
│   │   └── users.py         # /api/users — admin user management
│   ├── services/
│   │   ├── transaction_service.py  # All transaction + analytics logic
│   │   └── user_service.py         # User creation, auth, role changes
│   └── main.py              # FastAPI app, middleware, router registration
├── tests/
│   └── test_api.py          # 27 tests across auth, CRUD, roles, analytics
├── seed.py                  # Populates DB with realistic demo data
├── requirements.txt
└── README.md
```

---

## Setup & Running

### 1. Install dependencies

```bash
pip install -r requirements.txt
pip install 'pydantic[email]' 'bcrypt==4.0.1'
```

### 2. Seed the database (optional but recommended)

```bash
python seed.py
```

This creates 3 demo users and ~105 realistic transactions spanning the last 6 months.

### 3. Start the server

```bash
uvicorn app.main:app --reload
```

The API is now live at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

## API Reference

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a new account |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| GET | `/api/auth/me` | Any authenticated | Get own profile |

### Transactions

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/transactions/` | analyst, admin | Create a transaction |
| GET | `/api/transactions/` | all | List with filters + pagination |
| GET | `/api/transactions/summary` | all | Financial summary & analytics |
| GET | `/api/transactions/{id}` | all | Get single transaction |
| PATCH | `/api/transactions/{id}` | analyst (own), admin | Update transaction |
| DELETE | `/api/transactions/{id}` | admin only | Delete transaction |

**Supported filters** (all optional query params):
- `type` — `income` or `expense`
- `category` — e.g. `food`, `salary`, `housing`
- `date_from`, `date_to` — ISO date strings (`2024-01-01`)
- `min_amount`, `max_amount`
- `page`, `page_size` (default: 1, 20)

### Users (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/` | List all users |
| PATCH | `/api/users/{id}/role` | Change a user's role |
| DELETE | `/api/users/{id}` | Delete a user |

---

## Role-Based Access

| Action | viewer | analyst | admin |
|---|:---:|:---:|:---:|
| View own transactions | ✅ | ✅ | ✅ |
| View all transactions | ❌ | ✅ | ✅ |
| Create transactions | ❌ | ✅ | ✅ |
| Update own transactions | ❌ | ✅ | ✅ |
| Update any transaction | ❌ | ❌ | ✅ |
| Delete transactions | ❌ | ❌ | ✅ |
| View analytics summary | own data | all data | all data |
| Manage users | ❌ | ❌ | ✅ |

---

## Analytics Summary (`GET /api/transactions/summary`)

Returns a comprehensive breakdown:

```json
{
  "total_income": 8420.50,
  "total_expenses": 5310.20,
  "balance": 3110.30,
  "transaction_count": 45,
  "income_count": 15,
  "expense_count": 30,
  "top_income_category": "salary",
  "top_expense_category": "housing",
  "category_breakdown": [
    { "category": "housing", "total": 1800.00, "count": 2, "percentage": 21.4 }
  ],
  "monthly_totals": [
    { "year": 2024, "month": 3, "income": 3500.00, "expenses": 1200.50, "net": 2299.50 }
  ],
  "recent_transactions": [...]
}
```

---

## Running Tests

```bash
python -m pytest tests/ -v
```

27 tests covering:
- User registration and login (success + failure cases)
- JWT authentication and unauthenticated access
- Full transaction CRUD
- Amount and field validation
- Filtering by type, category, date range
- Pagination
- Analytics summary accuracy (balance math verified)
- Role enforcement across all endpoints

---

## Demo Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| admin | admin@fintrack.dev | admin123 |
| analyst | analyst@fintrack.dev | analyst123 |
| viewer | viewer@fintrack.dev | viewer123 |

---

## Assumptions

1. **Single-currency** — amounts are stored as floats; currency conversion is out of scope.
2. **Analysts can update their own transactions** — the spec implied analyst has write access; restricted to ownership for safety.
3. **Viewers see a summary of their own data** — useful for personal dashboard use case.
4. **The `login` endpoint uses email as the username field** — OAuth2's `PasswordRequestForm` has a `username` field by spec; we treat it as email.
5. **No soft deletes** — records are hard-deleted for simplicity; a production system would use `deleted_at`.
6. **bcrypt pinned to 4.0.1** — passlib has a known incompatibility with bcrypt ≥ 4.1 on Python 3.12; pinned for stability.
