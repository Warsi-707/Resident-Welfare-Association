-- AlterTable
ALTER TABLE "Challan" ADD COLUMN IF NOT EXISTS "whatsappStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Challan" ADD COLUMN IF NOT EXISTS "whatsappSentAt" TIMESTAMP(3);
ALTER TABLE "Challan" ADD COLUMN IF NOT EXISTS "whatsappMessageId" TEXT;
ALTER TABLE "Challan" ADD COLUMN IF NOT EXISTS "whatsappError" TEXT;

-- AlterTable
ALTER TABLE "AssociationSettings" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "AssociationSettings" ADD COLUMN IF NOT EXISTS "challanCopies" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "AssociationSettings" ADD COLUMN IF NOT EXISTS "whatsappSenderNumber" TEXT DEFAULT '+92 300 1234567';
ALTER TABLE "AssociationSettings" ADD COLUMN IF NOT EXISTS "whatsappAccessToken" TEXT;
ALTER TABLE "AssociationSettings" ADD COLUMN IF NOT EXISTS "whatsappPhoneNumberId" TEXT;
