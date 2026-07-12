# TransitOps Backend

FastAPI backend for the TransitOps logistics management system.

## Setup

```bash
cd Backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## API Docs

Visit `http://localhost:8000/docs` after starting the server.

## Structure

```
app/
├── api/        # Route handlers
├── models/     # SQLAlchemy ORM models
├── schemas/    # Pydantic schemas
├── services/   # Business logic
├── database.py # DB connection
└── main.py     # App entry point
```
