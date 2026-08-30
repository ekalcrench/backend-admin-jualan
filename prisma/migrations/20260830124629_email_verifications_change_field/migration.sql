/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `email_verifications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `last_sent_at` to the `email_verifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "email_verifications" ADD COLUMN     "last_sent_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_user_id_key" ON "email_verifications"("user_id");
