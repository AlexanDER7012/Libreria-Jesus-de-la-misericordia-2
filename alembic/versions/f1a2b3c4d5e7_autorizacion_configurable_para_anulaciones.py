"""Autorizaciones configurables para anulaciones

Revision ID: f1a2b3c4d5e7
Revises: f1a2b3c4d5e6
Create Date: 2026-11-20 19:27:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1a2b3c4d5e7"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "configuracion_general",
        sa.Column("requiere_autorizacion_compra", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "configuracion_general",
        sa.Column("requiere_autorizacion_venta", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "configuracion_general",
        sa.Column("requiere_autorizacion_inventario", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column("configuracion_general", "requiere_autorizacion_inventario")
    op.drop_column("configuracion_general", "requiere_autorizacion_venta")
    op.drop_column("configuracion_general", "requiere_autorizacion_compra")
