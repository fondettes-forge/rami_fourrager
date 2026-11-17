"""add straw_yield to stic

Revision ID: a1b2c3d4e5f6
Revises: fd5076041bff
Create Date: 2026-11-17

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "fd5076041bff"
branch_labels = None
depends_on = None


def upgrade():
    # colonne dédiée au rendement paille (kg/ha) — tickets 2/8
    op.add_column("stic", sa.Column("straw_yield", sa.String(length=255)))
    # migration des données existantes : Rdt_paille était stocké dans `rendement`
    op.execute("UPDATE stic SET straw_yield = rendement")


def downgrade():
    op.drop_column("stic", "straw_yield")
