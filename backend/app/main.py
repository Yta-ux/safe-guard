from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import init_db
from app.routers import reports, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Executa a criação de tabelas PostgreSQL no startup (caso ainda não tenham sido criadas)
    try:
        init_db()
    except Exception as e:
        print(f"[Warning] DB init check skipped/failed: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# CORS configuration for Frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(reports.router, prefix=f"{settings.API_V1_PREFIX}/reports", tags=["Reports"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_PREFIX}/dashboard", tags=["Dashboard"])

@app.get(f"{settings.API_V1_PREFIX}/health", tags=["Health"])
async def health_check():
    """Endpoint de verificação de integridade da API."""
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": settings.VERSION}
