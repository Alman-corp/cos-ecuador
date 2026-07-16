from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cos"
    openai_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-large"
    embedding_dimensions: int = 1536
    chunk_max_tokens: int = 512
    chunk_overlap_tokens: int = 64
    isd_min_confidence: float = 0.6
    top_k_hybrid: int = 10
    top_k_rerank: int = 5
    bm25_k1: float = 1.5
    bm25_b: float = 0.75
    rrf_k: int = 60
    vector_weight: float = 0.7
    bm25_weight: float = 0.3

    class Config:
        env_file = ".env"
        env_prefix = "DOC_"


settings = Settings()
