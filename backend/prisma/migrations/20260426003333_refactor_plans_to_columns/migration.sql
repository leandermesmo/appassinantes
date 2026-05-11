/*
  Warnings:

  - You are about to drop the column `features` on the `plans` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `idx_plans_active` ON `plans`;

-- AlterTable
ALTER TABLE `plans` DROP COLUMN `features`,
    ADD COLUMN `has_signal_alerts` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `has_vip_signals` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `max_favorites` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `max_history_records` INTEGER NOT NULL DEFAULT 20,
    ADD COLUMN `max_signals` INTEGER NOT NULL DEFAULT 1,
    MODIFY `billing_cycle` ENUM('MONTHLY', 'YEARLY') NOT NULL DEFAULT 'MONTHLY';
