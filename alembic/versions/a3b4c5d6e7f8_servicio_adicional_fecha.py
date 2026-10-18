"""servicio_adicional: columna fecha (para filtrar por rango de fechas)

Los servicios que ya existen y están ligados a una venta toman la fecha de
esa venta. Los que no tienen venta quedan sin fecha (no se inventa una).
Los nuevos guardan la fecha y hora en que se registran.

Revision ID: a3b4c5d6e7f8
Revises: f1a2b3c4d5e6
Create Date: 2026-10-16 14:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3b4c5d6e7f8'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Primero sin valor por defecto, para que los registros viejos no
    # queden con la fecha de hoy
    with op.batch_alter_table('servicio_adicional') as batch:
        batch.add_column(sa.Column('fecha', sa.DateTime(), nullable=True))

    op.execute(
        "UPDATE servicio_adicional SET fecha = "
        "(SELECT venta.fecha FROM venta WHERE venta.id = servicio_adicional.id_venta) "
        "WHERE id_venta IS NOT NULL"
    )

    with op.batch_alter_table('servicio_adicional') as batch:
        batch.alter_column('fecha', server_default=sa.func.now(), existing_type=sa.DateTime(), existing_nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('servicio_adicional') as batch:
        batch.drop_column('fecha')
