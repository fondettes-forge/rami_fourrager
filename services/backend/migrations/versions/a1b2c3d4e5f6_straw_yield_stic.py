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
    # colonne dédiée au rendement PAILLE (kg/ha) — tickets 2/8
    # NB : stic.rendement est le rendement GRAIN (ex: Blé 4500), pas la paille.
    # On ne fait donc PAS straw_yield = rendement (ce serait dupliquer le grain dans la paille).
    # La colonne est peuplée par le re-seed depuis la colonne CSV Rdt_paille2 (à remplir).
    op.add_column("stic", sa.Column("straw_yield", sa.String(length=255)))


def downgrade():
    op.drop_column("stic", "straw_yield")
