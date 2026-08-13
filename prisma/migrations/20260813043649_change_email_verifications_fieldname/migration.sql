/*
  Warnings:

  - You are about to drop the column `code_hash` on the `email_verifications` table. All the data in the column will be lost.
  - Added the required column `otp_hash` to the `email_verifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "email_verifications" DROP COLUMN "code_hash",
ADD COLUMN     "otp_hash" TEXT NOT NULL;
