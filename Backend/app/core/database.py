from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from app.core.config import settings

# create_engine connects Python to PostgreSQL using our configuration
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Automatically tests connections before using them
    pool_size=5,         # Number of persistent connections to keep open
    max_overflow=10      # Maximum temporary connections to open under load
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# DeclarativeBase is inherited by our database models in the next steps
class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
