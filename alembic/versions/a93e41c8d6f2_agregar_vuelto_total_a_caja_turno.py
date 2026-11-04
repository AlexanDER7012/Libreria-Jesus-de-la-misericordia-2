"""guardar el vuelto acumulado al cerrar un turno de caja

Revision ID: a93e41c8d6f2
Revises: 1b2c3d4e5f6a
Create Date: 2026-11-03 20:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a93e41c8d6f2"
down_revision: Union[str, Sequence[str], None] = "1b2c3d4e5f6a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("caja_turno") as batch:
        batch.add_column(
            sa.Column("vuelto_total", sa.DECIMAL(12, 2), nullable=False, server_default="0")
        )


def downgrade() -> None:
    with op.batch_alter_table("caja_turno") as batch:
        batch.drop_column("vuelto_total")
