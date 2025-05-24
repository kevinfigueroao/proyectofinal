// src/esquema-validacion/reservaSchema.js
import { object, string, number, array, email, minLength, nonEmpty, union } from "valibot";

// Validación para trabajadores de empresa (sin correo)
const TrabajadorEmpresaSchema = object({
    nombre: string([nonEmpty("El nombre es obligatorio.")]),
    rutPasaporte: string([nonEmpty("El RUT/Pasaporte es obligatorio.")]),
    edad: number("La edad debe ser un número."),
    cargo: string([nonEmpty("El cargo es obligatorio.")])
});

// Validación para trabajador particular (correo requerido)
const TrabajadorParticularSchema = object({
    nombre: string([nonEmpty("El nombre es obligatorio.")]),
    rutPasaporte: string([nonEmpty("El RUT/Pasaporte es obligatorio.")]),
    edad: number("La edad debe ser un número."),
    cargo: string([nonEmpty("El cargo es obligatorio.")]),
    correo: string([
        nonEmpty("El correo es obligatorio."),
        email("Correo no válido")
    ])
});

// Solicitante (empresa)
const SolicitanteSchema = object({
    nombre: string([nonEmpty("El nombre del solicitante es obligatorio.")]),
    cargo: string([nonEmpty("El cargo del solicitante es obligatorio.")]),
    telefono: string([
        nonEmpty("El teléfono es obligatorio."),
        minLength(8, "Mínimo 8 dígitos")
    ]),
    correo: string([
        nonEmpty("El correo es obligatorio."),
        email("Correo no válido")
    ])
});

// Empresa
const EmpresaSchema = object({
    nombre: string([nonEmpty("El nombre de la empresa es obligatorio.")]),
    rut: string([nonEmpty("El RUT de la empresa es obligatorio.")]),
    direccion: string([nonEmpty("La dirección es obligatoria.")]),
    giro: string([nonEmpty("El giro es obligatorio.")])
});

// Reserva particular (solo un trabajador, sin empresa ni solicitante)
const ReservaParticularSchema = object({
    tipoReserva: string([nonEmpty("El tipo de reserva es obligatorio.")]),
    sucursalId: number("La sucursal debe ser un número."),
    fechaHora: string([nonEmpty("La fecha y hora son obligatorias.")]),
    bateriaMedicaIds: array(number("Debe ser un número.")),
    examenAdicionalIds: array(number("Debe ser un número.")),
    pruebaDrogasIds: array(number("Debe ser un número.")),
    trabajadorInfo: TrabajadorParticularSchema
});

// Reserva empresa (array de trabajadores, empresa y solicitante)
const ReservaEmpresaSchema = object({
    tipoReserva: string([nonEmpty("El tipo de reserva es obligatorio.")]),
    sucursalId: number("La sucursal debe ser un número."),
    fechaHora: string([nonEmpty("La fecha y hora son obligatorias.")]),
    bateriaMedicaIds: array(number("Debe ser un número.")),
    examenAdicionalIds: array(number("Debe ser un número.")),
    pruebaDrogasIds: array(number("Debe ser un número.")),
    empresaInfo: EmpresaSchema,
    solicitanteInfo: SolicitanteSchema,
    trabajadorInfo: array(TrabajadorEmpresaSchema)
});

// Esquema principal de reserva
export const ReservaSchema = union([
    ReservaParticularSchema,
    ReservaEmpresaSchema
]);
