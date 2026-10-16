"""traslados: nota de envío y control de pagos a precio de costo

- traslado_sucursal: numero_nota_envio (único), monto_total, monto_pagado,
  estado_pago (Pendiente, Parcial, Pagado, No aplica).
- Tabla nueva traslado_pago: pagos de la sucursal destino por cada
  traslado (nunca se borran, se anulan).

Los traslados que ya existían reciben su número de nota (NE-000001...) y
quedan con estado_pago "No aplica", para no crear deudas que nadie registró.

Revision ID: f1a2b3c4d5e6
Revises: e7f8a9b0c1d2
Create Date: 2026-10-16 13:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e7f8a9b0c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('traslado_sucursal') as batch:
        batch.add_column(sa.Column('numero_nota_envio', sa.String(30), nullable=True))
        batch.add_column(sa.Column('monto_total', sa.DECIMAL(12, 2), nullable=True, server_default='0'))
        batch.add_column(sa.Column('monto_pagado', sa.DECIMAL(12, 2), nullable=True, server_default='0'))
        batch.add_column(sa.Column('estado_pago', sa.String(20), nullable=True, server_default='Pendiente'))

    conn = op.get_bind()
    filas = conn.execute(sa.text("SELECT id, cantidad, costo_unitario FROM traslado_sucursal")).fetchall()
    for id_t, cantidad, costo in filas:
        total = round(float(cantidad or 0) * float(costo or 0), 2)
        conn.execute(
            sa.text(
                "UPDATE traslado_sucursal SET numero_nota_envio = :n, monto_total = :t, "
                "monto_pagado = 0, estado_pago = 'No aplica' WHERE id = :id"
            ),
            {"n": f"NE-{id_t:06d}", "t": total, "id": id_t},
        )

    op.create_index('ix_traslado_sucursal_numero_nota_envio', 'traslado_sucursal', ['numero_nota_envio'], unique=True)

    op.create_table(
        'traslado_pago',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('id_traslado', sa.Integer(), sa.ForeignKey('traslado_sucursal.id'), nullable=False),
        sa.Column('id_tipo_pago', sa.Integer(), sa.ForeignKey('tipo_pago.id'), nullable=True),
        sa.Column('fecha_pago', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('monto', sa.DECIMAL(12, 2), nullable=False),
        sa.Column('referencia', sa.String(100), nullable=True),
        sa.Column('observaciones', sa.Text(), nullable=True),
        sa.Column('id_usuario', sa.Integer(), sa.ForeignKey('usuario.id'), nullable=True),
        sa.Column('anulado', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('motivo_anulacion', sa.Text(), nullable=True),
    )
    op.create_index('ix_traslado_pago_id_traslado', 'traslado_pago', ['id_traslado'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_traslado_pago_id_traslado', table_name='traslado_pago')
    op.drop_table('traslado_pago')
    op.drop_index('ix_traslado_sucursal_numero_nota_envio', table_name='traslado_sucursal')
    with op.batch_alter_table('traslado_sucursal') as batch:
        batch.drop_column('estado_pago')
        batch.drop_column('monto_pagado')
        batch.drop_column('monto_total')
        batch.drop_column('numero_nota_envio')
