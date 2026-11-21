"""Unir las ramas de migración de autorizaciones

Revision ID: f1a2b3c4d5e8
Revises: a6c8e1f3b205, f1a2b3c4d5e7
Create Date: 2026-11-20 19:56:00
"""
from typing import Sequence, Union

from alembic import op


revision: str = "f1a2b3c4d5e8"
down_revision: Union[str, Sequence[str], None] = ("a6c8e1f3b205", "f1a2b3c4d5e7")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
