/*
  Warnings:

  - Made the column `picture_profile` on table `Employee` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Employee` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date_of_birth` on table `Employee` required. This step will fail if there are existing NULL values in that column.
  - Made the column `place_of_birth` on table `Employee` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "picture_profile" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "date_of_birth" SET NOT NULL,
ALTER COLUMN "place_of_birth" SET NOT NULL;
