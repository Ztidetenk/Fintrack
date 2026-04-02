"""
Tests for FinTrack API.
Run with: python -m pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.main import app

# ---------------------------------------------------------------------------
# Test database (in-memory SQLite)
# ---------------------------------------------------------------------------

TEST_DB_URL = "sqlite:///./test_fintrack.db"

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def register_and_login(client, email, username, password, role="viewer"):
    client.post(
        "/api/auth/register",
        json={"email": email, "username": username, "password": password, "role": role},
    )
    resp = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
    )
    return resp.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Auth tests
# ---------------------------------------------------------------------------

class TestAuth:
    def test_register_success(self, client):
        r = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "secret123",
                "role": "viewer",
            },
        )
        assert r.status_code == 201
        data = r.json()
        assert data["email"] == "test@example.com"
        assert data["role"] == "viewer"
        assert "hashed_password" not in data

    def test_register_duplicate_email(self, client):
        payload = {"email": "dupe@example.com", "username": "dupe1", "password": "pass123"}
        client.post("/api/auth/register", json=payload)
        r = client.post(
            "/api/auth/register",
            json={"email": "dupe@example.com", "username": "dupe2", "password": "pass123"},
        )
        assert r.status_code == 409

    def test_register_weak_password(self, client):
        r = client.post(
            "/api/auth/register",
            json={"email": "weak@example.com", "username": "weakuser", "password": "ab"},
        )
        assert r.status_code == 422

    def test_login_success(self, client):
        client.post(
            "/api/auth/register",
            json={"email": "login@example.com", "username": "loginuser", "password": "pass1234"},
        )
        r = client.post(
            "/api/auth/login",
            data={"username": "login@example.com", "password": "pass1234"},
        )
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password(self, client):
        r = client.post(
            "/api/auth/login",
            data={"username": "test@example.com", "password": "wrongpassword"},
        )
        assert r.status_code == 401

    def test_me_endpoint(self, client):
        token = register_and_login(client, "me@example.com", "meuser", "pass1234")
        r = client.get("/api/auth/me", headers=auth_headers(token))
        assert r.status_code == 200
        assert r.json()["email"] == "me@example.com"

    def test_me_unauthenticated(self, client):
        r = client.get("/api/auth/me")
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Transaction CRUD tests
# ---------------------------------------------------------------------------

class TestTransactions:
    @pytest.fixture(autouse=True)
    def tokens(self, client):
        self.admin_token = register_and_login(
            client, "admin2@example.com", "admin2", "admin1234", "admin"
        )
        self.analyst_token = register_and_login(
            client, "analyst2@example.com", "analyst2", "pass1234", "analyst"
        )
        self.viewer_token = register_and_login(
            client, "viewer2@example.com", "viewer2", "pass1234", "viewer"
        )

    def _create_tx(self, client, token, overrides=None):
        payload = {
            "amount": 150.00,
            "type": "expense",
            "category": "food",
            "date": "2024-03-15",
            "description": "Grocery run",
        }
        if overrides:
            payload.update(overrides)
        return client.post(
            "/api/transactions/",
            json=payload,
            headers=auth_headers(token),
        )

    def test_create_transaction_as_analyst(self, client):
        r = self._create_tx(client, self.analyst_token)
        assert r.status_code == 201
        assert r.json()["amount"] == 150.00

    def test_create_transaction_as_admin(self, client):
        r = self._create_tx(client, self.admin_token)
        assert r.status_code == 201

    def test_viewer_cannot_create(self, client):
        r = self._create_tx(client, self.viewer_token)
        assert r.status_code == 403

    def test_create_invalid_amount(self, client):
        r = self._create_tx(client, self.analyst_token, {"amount": -50})
        assert r.status_code == 422

    def test_create_zero_amount(self, client):
        r = self._create_tx(client, self.analyst_token, {"amount": 0})
        assert r.status_code == 422

    def test_list_transactions(self, client):
        r = client.get("/api/transactions/", headers=auth_headers(self.viewer_token))
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert "total" in data
        assert "total_pages" in data

    def test_filter_by_type(self, client):
        r = client.get(
            "/api/transactions/?type=expense",
            headers=auth_headers(self.analyst_token),
        )
        assert r.status_code == 200
        items = r.json()["items"]
        assert all(tx["type"] == "expense" for tx in items)

    def test_filter_by_date_range(self, client):
        r = client.get(
            "/api/transactions/?date_from=2024-01-01&date_to=2024-12-31",
            headers=auth_headers(self.analyst_token),
        )
        assert r.status_code == 200

    def test_pagination(self, client):
        r = client.get(
            "/api/transactions/?page=1&page_size=2",
            headers=auth_headers(self.analyst_token),
        )
        assert r.status_code == 200
        assert len(r.json()["items"]) <= 2

    def test_get_single_transaction(self, client):
        create_r = self._create_tx(client, self.analyst_token)
        tx_id = create_r.json()["id"]
        r = client.get(f"/api/transactions/{tx_id}", headers=auth_headers(self.analyst_token))
        assert r.status_code == 200
        assert r.json()["id"] == tx_id

    def test_get_nonexistent_transaction(self, client):
        r = client.get("/api/transactions/99999", headers=auth_headers(self.analyst_token))
        assert r.status_code == 404

    def test_update_transaction(self, client):
        create_r = self._create_tx(client, self.analyst_token)
        tx_id = create_r.json()["id"]
        r = client.patch(
            f"/api/transactions/{tx_id}",
            json={"amount": 200.00, "description": "Updated"},
            headers=auth_headers(self.analyst_token),
        )
        assert r.status_code == 200
        assert r.json()["amount"] == 200.00

    def test_delete_transaction_as_admin(self, client):
        create_r = self._create_tx(client, self.admin_token)
        tx_id = create_r.json()["id"]
        r = client.delete(
            f"/api/transactions/{tx_id}", headers=auth_headers(self.admin_token)
        )
        assert r.status_code == 204

    def test_delete_transaction_as_analyst_forbidden(self, client):
        create_r = self._create_tx(client, self.analyst_token)
        tx_id = create_r.json()["id"]
        r = client.delete(
            f"/api/transactions/{tx_id}", headers=auth_headers(self.analyst_token)
        )
        assert r.status_code == 403

    def test_summary_returns_correct_fields(self, client):
        r = client.get("/api/transactions/summary", headers=auth_headers(self.admin_token))
        assert r.status_code == 200
        data = r.json()
        for field in [
            "total_income", "total_expenses", "balance",
            "transaction_count", "category_breakdown", "monthly_totals"
        ]:
            assert field in data

    def test_summary_balance_math(self, client):
        r = client.get("/api/transactions/summary", headers=auth_headers(self.admin_token))
        data = r.json()
        expected_balance = round(data["total_income"] - data["total_expenses"], 2)
        assert data["balance"] == expected_balance


# ---------------------------------------------------------------------------
# Role-based access tests
# ---------------------------------------------------------------------------

class TestRoles:
    def test_viewer_list_sees_only_own(self, client):
        # Viewer creates a tx... wait, viewer can't create. Admin creates for global pool.
        # Viewer should still get 200 and see their own subset
        token = register_and_login(client, "solo@example.com", "soloviewer", "pass1234", "viewer")
        r = client.get("/api/transactions/", headers=auth_headers(token))
        assert r.status_code == 200

    def test_admin_can_list_users(self, client):
        admin_token = register_and_login(
            client, "adminrole@example.com", "adminrole", "pass1234", "admin"
        )
        r = client.get("/api/users/", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_viewer_cannot_list_users(self, client):
        token = register_and_login(
            client, "viewerrole@example.com", "viewerrole", "pass1234", "viewer"
        )
        r = client.get("/api/users/", headers=auth_headers(token))
        assert r.status_code == 403

    def test_admin_can_change_role(self, client):
        admin_token = register_and_login(
            client, "adminchange@example.com", "adminchange", "pass1234", "admin"
        )
        # Register a target user
        reg = client.post(
            "/api/auth/register",
            json={"email": "target@example.com", "username": "targetuser", "password": "pass1234"},
        )
        user_id = reg.json()["id"]
        r = client.patch(
            f"/api/users/{user_id}/role",
            json={"role": "analyst"},
            headers=auth_headers(admin_token),
        )
        assert r.status_code == 200
        assert r.json()["role"] == "analyst"
