/*
  Warnings:

  - You are about to alter the column `status` on the `item` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `item` MODIFY `status` ENUM('NORMAL', 'DELETED') NOT NULL DEFAULT 'NORMAL';
