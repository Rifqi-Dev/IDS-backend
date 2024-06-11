/*
  Warnings:

  - Added the required column `date_joined` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "address" TEXT,
ADD COLUMN     "date_joined" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "gender" TEXT NOT NULL,
ADD COLUMN     "place_of_birth" TEXT;
