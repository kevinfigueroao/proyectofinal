-- CreateTable
CREATE TABLE "Sucursal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BateriaMedica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ExamenAdicional" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PruebaDrogas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Solicitante" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "giro" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Trabajador" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "rutPasaporte" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "cargo" TEXT NOT NULL,
    "correo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipoReserva" TEXT NOT NULL,
    "fechaHora" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "modificacionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "bateriaMedicaId" INTEGER,
    "examenAdicionalId" INTEGER,
    "pruebaDrogasId" INTEGER,
    "solicitanteId" INTEGER,
    "empresaId" INTEGER,
    "trabajadorId" INTEGER,
    CONSTRAINT "Reserva_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reserva_bateriaMedicaId_fkey" FOREIGN KEY ("bateriaMedicaId") REFERENCES "BateriaMedica" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reserva_examenAdicionalId_fkey" FOREIGN KEY ("examenAdicionalId") REFERENCES "ExamenAdicional" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reserva_pruebaDrogasId_fkey" FOREIGN KEY ("pruebaDrogasId") REFERENCES "PruebaDrogas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reserva_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Solicitante" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reserva_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reserva_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
