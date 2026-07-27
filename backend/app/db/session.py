from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Configuration for PostgreSQL Engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Garante a criação automática das tabelas PostgreSQL e seeding no startup."""
    from app.db.models import Report, Classification, RagQueryLog  # noqa: F401
    Base.metadata.create_all(bind=engine)
    
    try:
        from app.db.seed import seed_database
        seed_database()
    except Exception as e:
        print(f"[DB Init] Aviso ao rodar seed: {e}")
