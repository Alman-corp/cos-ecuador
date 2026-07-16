from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import torch
from FlagEmbedding import FlagReranker

app = FastAPI(title="BGE Reranker Service")

class RerankRequest(BaseModel):
    query: str
    texts: List[str]
    batch_size: Optional[int] = 32

class RerankResponse(BaseModel):
    scores: List[float]

model = None

@app.on_event("startup")
async def load_model():
    global model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = FlagReranker("BAAI/bge-reranker-v2-m3", use_fp16=(device == "cuda"), device=device)
    print(f"Model loaded on {device}")

@app.post("/rerank", response_model=RerankResponse)
async def rerank(request: RerankRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    pairs = [[request.query, text] for text in request.texts]
    scores = model.compute_score(pairs, batch_size=request.batch_size)
    if isinstance(scores, float):
        scores = [scores]
    return RerankResponse(scores=scores)

@app.get("/health")
async def health():
    return {"status": "ok", "model": "BAAI/bge-reranker-v2-m3", "device": "cuda" if torch.cuda.is_available() else "cpu"}
