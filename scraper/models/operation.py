"""
Enum for database operations.
"""
from enum import Enum


class Operation(str, Enum):
    """Database operation types."""
    INSERTED = "inserted"
    UPDATED = "updated"
    FAILED = "failed"
