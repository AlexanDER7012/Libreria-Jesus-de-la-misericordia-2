"""agregar activo a categoria, marca y unidad_medida

Permite editar y dar de baja / reactivar categorías, marcas y unidades
desde Inventario (antes no existía el campo y no se podía guardar el estado).
Los registros que ya existen quedan activos (server_default="1").

Revision ID: b3c1d2e4f5a6
Revises: 70bf0a7c9236
Create Date: 2026-10-07 21:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c1d2e4f5a6'
down_revision: Union[str, Sequence[str], None] = '70bf0a7c9236'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('categoria', sa.Column('activo', sa.Integer(), nullable=True, server_default='1'))
    op.add_column('marca', sa.Column('activo', sa.Integer(), nullable=True, server_default='1'))
    op.add_column('unidad_medida', sa.Column('activo', sa.Integer(), nullable=True, server_default='1'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('unidad_medida', 'activo')
    op.drop_column('marca', 'activo')
    op.drop_column('categoria', 'activo')
