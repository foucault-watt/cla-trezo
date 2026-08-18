-- CreateTable
CREATE TABLE "convention_pdf_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "cla_association_name" TEXT NOT NULL,
    "cla_address" TEXT NOT NULL,
    "cla_representatives" JSONB NOT NULL,
    "cla_signatory_name" TEXT NOT NULL,
    "cla_signatory_role" TEXT NOT NULL,
    "cla_signature_city" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convention_pdf_settings_pkey" PRIMARY KEY ("id")
);
