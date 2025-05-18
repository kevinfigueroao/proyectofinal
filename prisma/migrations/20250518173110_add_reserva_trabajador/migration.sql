/*
  Warnings:

  - You are about to drop the `_ReservaBaterias` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ReservaExamenes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ReservaPruebas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ReservaTrabajadores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `cargo` on the `Trabajador` table. All the data in the column will be lost.
  - You are about to drop the column `correo` on the `Trabajador` table. All the data in the column will be lost.
  - You are about to drop the column `edad` on the `Trabajador` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "_ReservaBaterias_B_index";

-- DropIndex
DROP INDEX "_ReservaBaterias_AB_unique";

-- DropIndex
DROP INDEX "_ReservaExamenes_B_index";

-- DropIndex
DROP INDEX "_ReservaExamenes_AB_unique";

-- DropIndex
DROP INDEX "_ReservaPruebas_B_index";

-- DropIndex
DROP INDEX "_ReservaPruebas_AB_unique";

-- DropIndex
DROP INDEX "_ReservaTrabajadores_B_index";

-- DropIndex
DROP INDEX "_ReservaTrabajadores_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ReservaBaterias";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ReservaExamenes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ReservaPruebas";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ReservaTrabajadores";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ReservaTrabajador" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservaId" INTEGER NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "cargo" TEXT NOT NULL,
    "correo" TEXT,
    "edad" INTEGER NOT NULL,
    CONSTRAINT "ReservaTrabajador_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReservaTrabajador_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReservaBateriasMedicas" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ReservaBateriasMedicas_A_fkey" FOREIGN KEY ("A") REFERENCES "BateriaMedica" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReservaBateriasMedicas_B_fkey" FOREIGN KEY ("B") REFERENCES "Reserva" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReservaExamenesAdicionales" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ReservaExamenesAdicionales_A_fkey" FOREIGN KEY ("A") REFERENCES "ExamenAdicional" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReservaExamenesAdicionales_B_fkey" FOREIGN KEY ("B") REFERENCES "Reserva" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReservaPruebasDrogas" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ReservaPruebasDrogas_A_fkey" FOREIGN KEY ("A") REFERENCES "PruebaDrogas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReservaPruebasDrogas_B_fkey" FOREIGN KEY ("B") REFERENCES "Reserva" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trabajador" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "rutPasaporte" TEXT NOT NULL
);
INSERT INTO "new_Trabajador" ("id", "nombre", "rutPasaporte") SELECT "id", "nombre", "rutPasaporte" FROM "Trabajador";
DROP TABLE "Trabajador";
ALTER TABLE "new_Trabajador" RENAME TO "Trabajador";
CREATE UNIQUE INDEX "Trabajador_rutPasaporte_key" ON "Trabajador"("rutPasaporte");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ReservaTrabajador_reservaId_trabajadorId_key" ON "ReservaTrabajador"("reservaId", "trabajadorId");

-- CreateIndex
CREATE UNIQUE INDEX "_ReservaBateriasMedicas_AB_unique" ON "_ReservaBateriasMedicas"("A", "B");

-- CreateIndex
CREATE INDEX "_ReservaBateriasMedicas_B_index" ON "_ReservaBateriasMedicas"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReservaExamenesAdicionales_AB_unique" ON "_ReservaExamenesAdicionales"("A", "B");

-- CreateIndex
CREATE INDEX "_ReservaExamenesAdicionales_B_index" ON "_ReservaExamenesAdicionales"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReservaPruebasDrogas_AB_unique" ON "_ReservaPruebasDrogas"("A", "B");

-- CreateIndex
CREATE INDEX "_ReservaPruebasDrogas_B_index" ON "_ReservaPruebasDrogas"("B");
