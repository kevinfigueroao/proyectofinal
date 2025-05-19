import { object, string, number, array, email, minLength, nonEmpty, union } from "valibot";

const TrabajadorEmpresaSchema = object({
    nombre: string([nonEmpty("El nombre es obligatorio.")]),
    rutPasaporte: string([nonEmpty("El RUT/Pasaporte es obligatorio.")]), // <--- este nombre!
    edad: number(),
    cargo: string([nonEmpty("El cargo es obligatorio.")])
});

const TrabajadorParticularSchema = object({
    nombre: string([nonEmpty("El nombre es obligatorio.")]),
    rutPasaporte: string([nonEmpty("El RUT/Pasaporte es obligatorio.")]), // <--- este nombre!
    edad: number(),
    cargo: string([nonEmpty("El cargo es obligatorio.")]),
    correo: string([email("Correo no válido"), nonEmpty("El correo es obligatorio.")])
});
// Solicitante (empresa)
const SolicitanteSchema = object({
    nombre: string([nonEmpty("El nombre del solicitante es obligatorio.")]),
    cargo: string([nonEmpty("El cargo del solicitante es obligatorio.")]),
    telefono: string([nonEmpty("El teléfono es obligatorio."), minLength(8, "Mínimo 8 dígitos")]),
    correo: string([email("Correo no válido"), nonEmpty("El correo es obligatorio.")])
});

// Empresa
const EmpresaSchema = object({
    nombre: string([nonEmpty("El nombre de la empresa es obligatorio.")]),
    rut: string([nonEmpty("El RUT de la empresa es obligatorio.")]),
    direccion: string([nonEmpty("La dirección es obligatoria.")]),
    giro: string([nonEmpty("El giro es obligatorio.")])
});

// Reserva particular
const ReservaParticularSchema = object({
    tipoReserva: string([nonEmpty()]),
    sucursalId: number(),
    fechaHora: string([nonEmpty()]),
    bateriaMedicaIds: array(number()),
    examenAdicionalIds: array(number()),
    pruebaDrogasIds: array(number()),
    trabajadorInfo: TrabajadorParticularSchema
});

// Reserva empresa (uno o más trabajadores)
const ReservaEmpresaSchema = object({
    tipoReserva: string([nonEmpty()]),
    sucursalId: number(),
    fechaHora: string([nonEmpty()]),
    bateriaMedicaIds: array(number()),
    examenAdicionalIds: array(number()),
    pruebaDrogasIds: array(number()),
    empresaInfo: EmpresaSchema,
    solicitanteInfo: SolicitanteSchema,
    trabajadorInfo: array(TrabajadorEmpresaSchema)
});

// Esquema principal
export const ReservaSchema = union([ReservaParticularSchema, ReservaEmpresaSchema]);
