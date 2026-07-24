"""
API package — aggregates all versioned routers into a single router
that main.py includes on the FastAPI app.

Individual sub-routers are registered in Checkpoint 15.
Keeping this file as a valid router import now means main.py
can include it without modification in the next checkpoint.
"""

from fastapi import APIRouter

# Single router that main.py includes — keeps main.py clean.
# Sub-routers are added in Checkpoint 15.
router = APIRouter()
