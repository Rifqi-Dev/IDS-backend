-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "access_menus" INTEGER[];

-- CreateTable
CREATE TABLE "AccessMenu" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "children" INTEGER,

    CONSTRAINT "AccessMenu_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AccessMenu" ADD CONSTRAINT "AccessMenu_children_fkey" FOREIGN KEY ("children") REFERENCES "AccessMenu"("id") ON DELETE SET NULL ON UPDATE CASCADE;
