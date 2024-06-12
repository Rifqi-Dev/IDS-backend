/*
  Warnings:

  - You are about to drop the column `children` on the `AccessMenu` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccessMenu" DROP CONSTRAINT "AccessMenu_children_fkey";

-- AlterTable
ALTER TABLE "AccessMenu" DROP COLUMN "children",
ADD COLUMN     "parent" INTEGER;

-- AddForeignKey
ALTER TABLE "AccessMenu" ADD CONSTRAINT "AccessMenu_parent_fkey" FOREIGN KEY ("parent") REFERENCES "AccessMenu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
