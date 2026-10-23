"""traslado_sucursal: stock_descontado (mercadería en camino)

Desde esta versión, al registrar un traslado la mercadería se descuenta
del origen en ese momento (queda "en camino") y se suma al destino al
recibirla; si se cancela, regresa al origen.

stock_descontado = 1 marca los traslados que ya restaron del origen al
crearse. Los traslados que ya existían quedan en 0 y se siguen
recibiendo como antes (restan del origen al recibirse), para que el
stock no se descuente dos veces.

Revision ID: c7d8e9f0a1b2
Revises: a3b4c5d6e7f8
Create Date: 2026-10-22 17:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7d8e9f0a1b2'
down_revision: Union[str, Sequence[str], None] = 'a3b4c5d6e7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('traslado_sucursal') as batch:
        batch.add_column(sa.Column('stock_descontado', sa.Integer(), nullable=True, server_default='0'))
    op.execute("UPDATE traslado_sucursal SET stock_descontado = 0 WHERE stock_descontado IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('traslado_sucursal') as batch:
        batch.drop_column('stock_descontado')
