/*
  Warnings:

  - You are about to alter the column `status` on the `comment` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(5))`.

*/
-- AlterTable
ALTER TABLE `comment` MODIFY `status` ENUM('NORMAL', 'DELETED') NOT NULL DEFAULT 'NORMAL';
