"""quitar el vuelto registrado por turno

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-11-03 20:55:00
"""
from typing import Sequence, Union

from alembic import op


revision: str = "c2d3e4f5a6b7"
down_revision: Union[str, Sequence[str], None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("caja_turno") as batch:
        batch.drop_column("vuelto_total")


def downgrade() -> None:
    import sqlalchemy as sa

    with op.batch_alter_table("caja_turno") as batch:
        batch.add_column(
            sa.Column(
                "vuelto_total",
                sa.DECIMAL(12, 2),
                nullable=False,
                server_default="0",
            )
        )
