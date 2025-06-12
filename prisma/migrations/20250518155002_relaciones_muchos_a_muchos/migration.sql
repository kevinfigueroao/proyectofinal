/*
  Warnings:

  - You are about to drop the column `bateriaMedicaId` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `examenAdicionalId` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `pruebaDrogasId` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `trabajadorId` on the `Reserva` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_ReservaBaterias" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ReservaBaterias_A_fkey" FOREIGN KEY ("A") REFERENCES "BateriaMedica" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReservaBaterias_B_fkey" FOREIGN KEY ("B") REFERENCES "Reserva" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReservaExamenes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ReservaExamenes_A_fkey" FOREIGN KEY ("A") REFERENCES "ExamenAdicional" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReservaExamenes_B_fkey" FOREIGN KEY ("B") REFERENCES "Reserva" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReservaPruebas" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ReservaPruebas_A_fkey" FOREIGN KEY ("A") REFERENCES "PruebaDrogas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReservaPruebas_B_fkey" FOREIGN KEY ("B") REFERENCES "Reserva" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReservaTrabajadores" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ReservaTrabajadores_A_fkey" FOREIGN KEY ("A") REFERENCES "Reserva" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReservaTrabajadores_B_fkey" FOREIGN KEY ("B") REFERENCES "Trabajador" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reserva" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipoReserva" TEXT NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "modificacionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "solicitanteId" INTEGER,
    "empresaId" INTEGER,
    CONSTRAINT "Reserva_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reserva_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Solicitante" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reserva_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reserva" ("createdAt", "empresaId", "estado", "fechaHora", "id", "modificacionCount", "solicitanteId", "sucursalId", "tipoReserva", "updatedAt") SELECT "createdAt", "empresaId", "estado", "fechaHora", "id", "modificacionCount", "solicitanteId", "sucursalId", "tipoReserva", "updatedAt" FROM "Reserva";
DROP TABLE "Reserva";
ALTER TABLE "new_Reserva" RENAME TO "Reserva";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ReservaBaterias_AB_unique" ON "_ReservaBaterias"("A", "B");

-- CreateIndex
CREATE INDEX "_ReservaBaterias_B_index" ON "_ReservaBaterias"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReservaExamenes_AB_unique" ON "_ReservaExamenes"("A", "B");

-- CreateIndex
CREATE INDEX "_ReservaExamenes_B_index" ON "_ReservaExamenes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReservaPruebas_AB_unique" ON "_ReservaPruebas"("A", "B");

-- CreateIndex
CREATE INDEX "_ReservaPruebas_B_index" ON "_ReservaPruebas"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReservaTrabajadores_AB_unique" ON "_ReservaTrabajadores"("A", "B");

-- CreateIndex
CREATE INDEX "_ReservaTrabajadores_B_index" ON "_ReservaTrabajadores"("B");
