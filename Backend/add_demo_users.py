"""
Run this script once to add demo users for every role.
It does NOT clear existing data.

Usage:
    cd Backend
    .venv\Scripts\python add_demo_users.py
"""
from passlib.context import CryptContext
from app.core.database import SessionLocal
from app.models.user import User, Role

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_USERS = [
    {"role": "ADMIN",            "email": "admin@transitops.com",     "name": "Admin User",         "password": "admin123"},
    {"role": "FLEET_MANAGER",    "email": "fleet@transitops.com",     "name": "Fleet Manager",      "password": "fleet123"},
    {"role": "DISPATCHER",       "email": "dispatcher@transitops.com","name": "Alex Dispatcher",    "password": "dispatcher123"},
    {"role": "SAFETY_OFFICER",   "email": "safety@transitops.com",    "name": "Safety Officer",     "password": "safety123"},
    {"role": "FINANCIAL_ANALYST","email": "finance@transitops.com",   "name": "Financial Analyst",  "password": "finance123"},
]

def run():
    db = SessionLocal()
    try:
        roles = {r.name: r.id for r in db.query(Role).all()}
        print(f"Found roles: {list(roles.keys())}")

        added = 0
        for u in DEMO_USERS:
            exists = db.query(User).filter(User.email == u["email"]).first()
            if exists:
                print(f"  SKIP  {u['email']} (already exists)")
                continue

            role_id = roles.get(u["role"])
            if not role_id:
                print(f"  WARN  role '{u['role']}' not found in DB, skipping {u['email']}")
                continue

            user = User(
                email=u["email"],
                password_hash=pwd_context.hash(u["password"]),
                full_name=u["name"],
                role_id=role_id,
                is_active=True,
            )
            db.add(user)
            added += 1
            print(f"  ADD   {u['email']}  role={u['role']}")

        db.commit()
        print(f"\nDone — {added} user(s) added.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run()
