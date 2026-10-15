-- CreateTable
CREATE TABLE "page_view" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "asso_id" UUID,
    "path" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_view_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_monthly_stat" (
    "id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "metric" TEXT NOT NULL,
    "asso_id" UUID,
    "route" TEXT NOT NULL DEFAULT '',
    "value" INTEGER NOT NULL,

    CONSTRAINT "usage_monthly_stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "actor_is_admin" BOOLEAN NOT NULL,
    "from_admin_space" BOOLEAN NOT NULL,
    "model" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_id" TEXT,
    "asso_id" UUID,
    "path" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_log_user_id_connected_at_idx" ON "user_log"("user_id", "connected_at");

-- CreateIndex
CREATE INDEX "page_view_user_id_created_at_idx" ON "page_view"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "page_view_created_at_idx" ON "page_view"("created_at");

-- CreateIndex
CREATE INDEX "usage_monthly_stat_month_idx" ON "usage_monthly_stat"("month");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_created_at_idx" ON "audit_log"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_asso_id_created_at_idx" ON "audit_log"("asso_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_action_created_at_idx" ON "audit_log"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "page_view" ADD CONSTRAINT "page_view_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
