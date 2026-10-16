"""stock por ubicación (tabla inventario_ubicacion)

Crea la tabla con el stock de cada producto en cada ubicación (sucursal,
bodega, área de ventas...). El stock que ya existe (producto.stock_actual)
se asigna completo a la ubicación principal: la "Ubicación por defecto" de
Configuración general o, si no hay, la primera ubicación activa. Así nada
cambia en los totales al aplicar la migración.

Revision ID: e7f8a9b0c1d2
Revises: d5e6f7a8b9c0
Create Date: 2026-10-16 00:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, Sequence[str], None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'inventario_ubicacion',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('id_producto', sa.Integer(), sa.ForeignKey('producto.id'), nullable=False),
        sa.Column('id_ubicacion', sa.Integer(), sa.ForeignKey('ubicacion.id'), nullable=False),
        sa.Column('cantidad', sa.DECIMAL(12, 2), nullable=False, server_default='0'),
        sa.UniqueConstraint('id_producto', 'id_ubicacion', name='uq_inventario_producto_ubicacion'),
    )
    op.create_index('ix_inventario_ubicacion_id_producto', 'inventario_ubicacion', ['id_producto'])
    op.create_index('ix_inventario_ubicacion_id_ubicacion', 'inventario_ubicacion', ['id_ubicacion'])

    # Stock existente -> ubicación principal
    conn = op.get_bind()
    principal = conn.execute(sa.text(
        "SELECT id_ubicacion FROM configuracion_general "
        "WHERE id_ubicacion IS NOT NULL ORDER BY id LIMIT 1"
    )).scalar()
    if not principal:
        principal = conn.execute(sa.text(
            "SELECT id FROM ubicacion WHERE activo IS NULL OR activo <> 0 ORDER BY id LIMIT 1"
        )).scalar()
    if not principal:
        principal = conn.execute(sa.text("SELECT id FROM ubicacion ORDER BY id LIMIT 1")).scalar()

    if principal:
        conn.execute(
            sa.text(
                "INSERT INTO inventario_ubicacion (id_producto, id_ubicacion, cantidad) "
                "SELECT id, :ubicacion, stock_actual FROM producto "
                "WHERE stock_actual IS NOT NULL AND stock_actual <> 0"
            ),
            {"ubicacion": principal},
        )
    # Si no hay ninguna ubicación todavía, no se inserta nada: el sistema
    # asigna el stock a la primera ubicación que se cree la primera vez que
    # ese producto tenga un movimiento (app/stock.py, asegurar_filas).


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_inventario_ubicacion_id_ubicacion', table_name='inventario_ubicacion')
    op.drop_index('ix_inventario_ubicacion_id_producto', table_name='inventario_ubicacion')
    op.drop_table('inventario_ubicacion')
