# Proyecto Node.js + Express + Prisma + SQLite

Este proyecto es una aplicación web construida con **Node.js** y **Express**, utilizando **Prisma** como ORM y **SQLite** como base de datos.

## Requisitos

- Node.js (v18 o superior recomendado)
- npm (v9 o superior recomendado)

## Instrucciones para probar la aplicación

### 1. Descargar el proyecto

Descarga y descomprime la carpeta del proyecto.

### 2. Instalar dependencias

Abre una terminal, navega hasta la carpeta del proyecto y ejecuta:    npm install

### 3. Generar el cliente de Prisma

Es necesario generar el cliente de Prisma antes de ejecutar migraciones o levantar la app: npx prisma generate

### 5. Ejecutar migraciones de Prisma

Esto creará las tablas necesarias en la base de datos:    npx prisma migrate dev --name init

### 6.  Poblar la base de datos con datos de ejemplo

npx prisma db seed

### 7. Iniciar la aplicación

npm run dev







