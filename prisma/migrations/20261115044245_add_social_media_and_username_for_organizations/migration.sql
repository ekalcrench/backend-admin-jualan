/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "social_media_platform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'YOUTUBE', 'WHATSAPP', 'X', 'THREADS');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "username" VARCHAR(30);

-- CreateTable
CREATE TABLE "organization_social_medias" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "platform" "social_media_platform" NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_social_medias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_social_medias_username_key" ON "organization_social_medias"("username");

-- CreateIndex
CREATE INDEX "organization_social_medias_organization_id_idx" ON "organization_social_medias"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_social_medias_organization_id_platform_key" ON "organization_social_medias"("organization_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_username_key" ON "organizations"("username");

-- AddForeignKey
ALTER TABLE "organization_social_medias" ADD CONSTRAINT "organization_social_medias_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
