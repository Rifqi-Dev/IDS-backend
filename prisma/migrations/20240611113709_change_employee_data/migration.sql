-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_location_id_fkey";

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "picture_profile" DROP NOT NULL,
ALTER COLUMN "location_id" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "date_joined" DROP NOT NULL,
ALTER COLUMN "date_of_birth" DROP NOT NULL,
ALTER COLUMN "gender" DROP NOT NULL,
ALTER COLUMN "place_of_birth" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
