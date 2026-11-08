"""Agregar referencia del proveedor a pedido

Revision ID: 4fd7a12c9e31
Revises: c2d3e4f5a6b7
Create Date: 2026-11-08 14:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4fd7a12c9e31"
down_revision: Union[str, Sequence[str], None] = "c2d3e4f5a6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pedido", sa.Column("numero_pedido", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("pedido", "numero_pedido")
