"""guardar la dirección de cada traslado respecto a la ubicación principal

Revision ID: 1b2c3d4e5f6a
Revises: 9ab1c2d3e4f5
Create Date: 2026-10-29 21:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1b2c3d4e5f6a"
down_revision: Union[str, Sequence[str], None] = "9ab1c2d3e4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("traslado_sucursal") as batch:
        batch.add_column(
            sa.Column(
                "direccion",
                sa.String(length=20),
                nullable=False,
                server_default="Entre ubicaciones",
            )
        )

    conn = op.get_bind()
    principal = conn.execute(
        sa.text(
            "SELECT id_ubicacion FROM configuracion_general "
            "WHERE id_ubicacion IS NOT NULL ORDER BY id LIMIT 1"
        )
    ).scalar()
    if principal is None:
        principal = conn.execute(
            sa.text("SELECT id FROM ubicacion WHERE activo != 0 ORDER BY id LIMIT 1")
        ).scalar()
    if principal is None:
        principal = conn.execute(
            sa.text("SELECT id FROM ubicacion ORDER BY id LIMIT 1")
        ).scalar()
    if principal is not None:
        conn.execute(
            sa.text(
                "UPDATE traslado_sucursal SET direccion = 'Saliente' "
                "WHERE id_ubicacion_origen = :principal"
            ),
            {"principal": principal},
        )
        conn.execute(
            sa.text(
                "UPDATE traslado_sucursal SET direccion = 'Entrante' "
                "WHERE id_ubicacion_destino = :principal "
                "AND id_ubicacion_origen <> :principal"
            ),
            {"principal": principal},
        )


def downgrade() -> None:
    with op.batch_alter_table("traslado_sucursal") as batch:
        batch.drop_column("direccion")
