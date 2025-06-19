-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReservaTrabajador" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservaId" INTEGER NOT NULL,
    "trabajadorId" INTEGER NOT NULL,
    "cargo" TEXT NOT NULL,
    "correo" TEXT,
    "edad" INTEGER NOT NULL,
    "asistio" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ReservaTrabajador_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReservaTrabajador_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReservaTrabajador" ("cargo", "correo", "edad", "id", "reservaId", "trabajadorId") SELECT "cargo", "correo", "edad", "id", "reservaId", "trabajadorId" FROM "ReservaTrabajador";
DROP TABLE "ReservaTrabajador";
ALTER TABLE "new_ReservaTrabajador" RENAME TO "ReservaTrabajador";
CREATE UNIQUE INDEX "ReservaTrabajador_reservaId_trabajadorId_key" ON "ReservaTrabajador"("reservaId", "trabajadorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
