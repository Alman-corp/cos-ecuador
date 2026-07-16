from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import documents, search

app = FastAPI(
    title="Document Processor API",
    description="RAG pipeline: extracción, chunking semántico, embeddings y búsqueda híbrida con ISD",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
