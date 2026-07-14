"""
Template API endpoints are defined in api/documents.py to ensure correct
route registration order (static /templates before dynamic /{doc_id}).
This module exists for organizational purposes and re-exports.
"""
from api.documents import router
