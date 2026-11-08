"""Agregar referencia única a cotización

Revision ID: a6c8e1f3b205
Revises: 4fd7a12c9e31
Create Date: 2026-11-08 17:16:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a6c8e1f3b205"
down_revision: Union[str, Sequence[str], None] = "4fd7a12c9e31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("cotizacion") as batch_op:
        batch_op.add_column(sa.Column("referencia", sa.String(length=100), nullable=True))
        batch_op.create_unique_constraint("uq_cotizacion_referencia", ["referencia"])


def downgrade() -> None:
    with op.batch_alter_table("cotizacion") as batch_op:
        batch_op.drop_constraint("uq_cotizacion_referencia", type_="unique")
        batch_op.drop_column("referencia")
