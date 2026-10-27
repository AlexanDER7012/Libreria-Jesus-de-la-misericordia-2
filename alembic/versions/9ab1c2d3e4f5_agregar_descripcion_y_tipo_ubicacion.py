"""guardar descripcion y tipo de ubicacion

Revision ID: 9ab1c2d3e4f5
Revises: c7d8e9f0a1b2
Create Date: 2026-10-26 19:45:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9ab1c2d3e4f5"
down_revision: Union[str, Sequence[str], None] = "c7d8e9f0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("ubicacion") as batch:
        batch.add_column(sa.Column("descripcion", sa.Text(), nullable=True))
        batch.add_column(sa.Column("tipo", sa.String(length=50), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("ubicacion") as batch:
        batch.drop_column("tipo")
        batch.drop_column("descripcion")
