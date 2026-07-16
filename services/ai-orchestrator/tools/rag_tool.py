"""
RAG tool para consultar documentos tributarios con ISD.
Usa el pipeline híbrido (vector + BM25 + RRF) del document-processor.
"""
from typing import Optional
from langchain_core.tools import tool
import httpx

DOC_PROCESSOR_URL = "http://document-processor:8003/api/v1"


@tool
def search_tax_documents(
    query: str,
    tenant_id: str,
    law_type: Optional[str] = None,
    top_k: int = 5,
) -> dict:
    """
    Busca documentos tributarios y legislación SRI usando RAG híbrido.

    Args:
        query: Consulta o pregunta del usuario sobre legislación tributaria
        tenant_id: ID del tenant para filtrar por organización
        law_type: Tipo de ley (LRTI, RLRTI, CODIGO_TRIBUTARIO, RESOLUCIONES)
        top_k: Número de resultados relevantes (default 5)

    Returns:
        Fragmentos de documentos relevantes con citas legales
        (artículo, ley, contenido) y puntuación de relevancia.
    """
    try:
        resp = httpx.post(
            f"{DOC_PROCESSOR_URL}/search/hybrid",
            json={
                "query": query,
                "law_type": law_type,
                "top_k": top_k,
                "tenant_id": tenant_id,
            },
            timeout=15.0,
        )
        if resp.status_code == 200:
            data = resp.json()
            return {
                "query": query,
                "results": [
                    {
                        "content": r["chunk"]["content"],
                        "score": r["score"],
                        "law_type": r["chunk"].get("law_type"),
                        "article": r["chunk"].get("article"),
                        "has_isd": r["chunk"].get("has_isd", False),
                    }
                    for r in data.get("results", [])
                ],
                "total": data.get("total", 0),
            }
        return {"error": f"Error en búsqueda RAG: {resp.status_code}"}
    except Exception as e:
        return {"error": f"Error conectando con document-processor: {str(e)}"}
