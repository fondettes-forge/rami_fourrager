"""ticket 22 — ajouter la colonne source à stic

Revision ID: d3f8a21c9b4e
Revises: f6d196dc5629
Create Date: 2026-11-24

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d3f8a21c9b4e"
down_revision = "f6d196dc5629"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("stic", sa.Column("source", sa.String(255), nullable=True))


def downgrade():
    op.drop_column("stic", "source")
