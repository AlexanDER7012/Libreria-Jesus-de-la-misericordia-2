"""asociar egresos de caja chica a turnos

Revision ID: b1c2d3e4f5a6
Revises: a93e41c8d6f2
Create Date: 2026-11-04 00:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "a93e41c8d6f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("caja_chica_movimiento") as batch:
        batch.add_column(sa.Column("id_caja_turno", sa.Integer(), nullable=True))
        batch.create_foreign_key(
            "fk_caja_chica_movimiento_id_caja_turno",
            "caja_turno",
            ["id_caja_turno"],
            ["id"],
        )
        batch.create_index(
            "ix_caja_chica_movimiento_id_caja_turno",
            ["id_caja_turno"],
            unique=False,
        )
    with op.batch_alter_table("caja_turno") as batch:
        batch.add_column(
            sa.Column(
                "gastos_caja_chica",
                sa.DECIMAL(12, 2),
                nullable=False,
                server_default="0",
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("caja_turno") as batch:
        batch.drop_column("gastos_caja_chica")
    with op.batch_alter_table("caja_chica_movimiento") as batch:
        batch.drop_index("ix_caja_chica_movimiento_id_caja_turno")
        batch.drop_constraint(
            "fk_caja_chica_movimiento_id_caja_turno",
            type_="foreignkey",
        )
        batch.drop_column("id_caja_turno")
