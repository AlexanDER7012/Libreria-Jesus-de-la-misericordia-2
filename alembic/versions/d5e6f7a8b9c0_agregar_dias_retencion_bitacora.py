"""agregar dias_retencion_bitacora a configuracion_general

Cuántos días se conserva la bitácora (log_actividad). Los registros más
viejos se borran solos. 0 = no borrar nunca (valor por defecto, así nada
cambia hasta que alguien lo configure en Configuración).

Revision ID: d5e6f7a8b9c0
Revises: b3c1d2e4f5a6
Create Date: 2026-10-09 16:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = 'b3c1d2e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'configuracion_general',
        sa.Column('dias_retencion_bitacora', sa.Integer(), nullable=True, server_default='0'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('configuracion_general', 'dias_retencion_bitacora')
