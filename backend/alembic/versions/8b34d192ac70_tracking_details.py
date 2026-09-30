"""Application organization and interview preparation."""

from alembic import op
import sqlalchemy as sa

revision = "8b34d192ac70"
down_revision = "21accb4988b5"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("applications", sa.Column("company_website", sa.String(2048), nullable=True))
    op.add_column(
        "applications", sa.Column("priority", sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.add_column(
        "applications", sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.add_column("interviews", sa.Column("status", sa.String(20), nullable=False, server_default="upcoming"))
    for name in ("preparation_notes", "questions_to_ask", "outcome_notes"):
        op.add_column("interviews", sa.Column(name, sa.Text(), nullable=True))
    # Preserve the old product's interpretation of past interviews on upgrade.
    op.execute(sa.text("UPDATE interviews SET status = 'completed' WHERE scheduled_at < CURRENT_TIMESTAMP"))


def downgrade():
    for name in ("outcome_notes", "questions_to_ask", "preparation_notes", "status"):
        op.drop_column("interviews", name)
    for name in ("is_archived", "priority", "company_website"):
        op.drop_column("applications", name)
