-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trabajador" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "rutPasaporte" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "cargo" TEXT NOT NULL,
    "correo" TEXT
);
INSERT INTO "new_Trabajador" ("cargo", "correo", "edad", "id", "nombre", "rutPasaporte") SELECT "cargo", "correo", "edad", "id", "nombre", "rutPasaporte" FROM "Trabajador";
DROP TABLE "Trabajador";
ALTER TABLE "new_Trabajador" RENAME TO "Trabajador";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
