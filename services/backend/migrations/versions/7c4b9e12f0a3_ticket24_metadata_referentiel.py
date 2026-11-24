"""ticket 24 — métadonnées référentiel : resume (stic) + description (site, climatic_year, feed_type, concentrated_feed)

Revision ID: 7c4b9e12f0a3
Revises: d3f8a21c9b4e
Create Date: 2026-11-24

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "7c4b9e12f0a3"
down_revision = "d3f8a21c9b4e"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("stic", sa.Column("resume", sa.Text(), nullable=True))
    op.add_column("site", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("climatic_year", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("feed_type", sa.Column("description", sa.Text(), nullable=True))
    op.add_column(
        "concentrated_feed", sa.Column("description", sa.Text(), nullable=True)
    )


def downgrade():
    op.drop_column("concentrated_feed", "description")
    op.drop_column("feed_type", "description")
    op.drop_column("climatic_year", "description")
    op.drop_column("site", "description")
    op.drop_column("stic", "resume")
