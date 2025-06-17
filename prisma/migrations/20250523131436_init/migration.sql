/*
  Warnings:

  - A unique constraint covering the columns `[rut]` on the table `Empresa` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'sucursal',
    "sucursalId" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Usuario_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_rut_key" ON "Empresa"("rut");
