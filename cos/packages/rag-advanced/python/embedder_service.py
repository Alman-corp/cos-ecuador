from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import torch
from FlagEmbedding import FlagModel

app = FastAPI(title="BGE Embedder Service")

class EmbedRequest(BaseModel):
    texts: List[str]
    max_length: Optional[int] = 8192
    normalize: Optional[bool] = True

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimensions: int

model = None

@app.on_event("startup")
async def load_model():
    global model
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = FlagModel("BAAI/bge-m3", use_fp16=(device == "cuda"), device=device)
    print(f"Model loaded on {device}")

@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    embeddings = model.encode(request.texts, max_length=request.max_length)
    if request.normalize:
        embeddings = embeddings / torch.norm(embeddings, dim=1, keepdim=True)
    return EmbedResponse(
        embeddings=embeddings.tolist(),
        dimensions=embeddings.shape[1]
    )

@app.get("/health")
async def health():
    return {"status": "ok", "model": "BAAI/bge-m3", "dimensions": 1024, "device": "cuda" if torch.cuda.is_available() else "cpu"}
