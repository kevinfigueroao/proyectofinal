import * as v from "valibot";
import { validarRut } from 'validar-rut-chile';

const rutOPasaporteValido = v.custom((valor) => {
    // Limpia la entrada
    const limpio = valor.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
    // RUT chileno: 7 u 8 dígitos + dígito verificador
    if (/^\d{7,8}[0-9K]$/.test(limpio)) {
        return validarRut(limpio);
    }
    // Pasaporte: 6 a 15 caracteres alfanuméricos (puedes ajustar el rango)
    if (/^[A-Z0-9]{6,15}$/.test(limpio)) {
        return true;
    }
    return false;
}, "Debe ser un RUT válido o un pasaporte válido.");


const rutEmpresa = v.custom((valor) => {
    const limpio = valor.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
    return /^\d{7,8}[0-9K]$/.test(limpio) && validarRut(limpio);
}, "RUT de la empresa no válido.");


function normalizarRut(rut) {
    let limpio = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
    // Asegura que tenga un guion antes del verificador
    if (/^\d{7,8}[0-9K]$/.test(limpio)) {
        return limpio.slice(0, -1) + '-' + limpio.slice(-1);
    }
    return limpio;
}


// ----- Solicitante (empresa) -----
const SolicitanteSchema = v.object({
    nombre: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "El nombre del solicitante es obligatorio."),
        v.maxLength(255)
    ),
    cargo: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "El cargo del solicitante es obligatorio."),
        v.maxLength(255)
    ),
    telefono: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(8, "El número de teléfono de tener mínimo 8 dígitos"),
        v.maxLength(20)
    ),
    correo: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "El correo es obligatorio."),
        v.email("Correo no válido"),
        v.maxLength(255)
    )
});

// ----- Empresa -----
const EmpresaSchema = v.object({
    nombre: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "El nombre de la empresa es obligatorio."),
        v.maxLength(255)
    ),
    rut: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "El RUT de la empresa es obligatorio."),
        rutEmpresa,
        v.transform(normalizarRut)
    ),

    direccion: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "La dirección es obligatoria."),
        v.maxLength(255)
    ),
    giro: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "El giro es obligatorio."),
        v.maxLength(255)
    )
});

// ----- Reserva Particular -----
const ReservaParticularSchema = v.object({
    tipoReserva: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "El tipo de reserva es obligatorio.")
    ),
    sucursalId: v.pipe(
        v.union([v.number(), v.string()]),
        v.transform(Number),
        v.number()
    ),
    fechaHora: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "La fecha y hora son obligatorias.")
    ),
    bateriaMedicaIds: v.array(v.number()),
    examenAdicionalIds: v.array(v.number()),
    pruebaDrogasIds: v.array(v.number()),
    trabajadorInfo: v.object({
        nombre: v.pipe(
            v.string(),
            v.trim(),
            v.minLength(1, "El nombre es obligatorio."),
            v.maxLength(255)
        ),
        rutPasaporte: v.pipe(
            v.string(),
            v.trim(),
            v.minLength(1, "El RUT/Pasaporte es obligatorio."),
            rutOPasaporteValido,
            v.transform(normalizarRut)
        ),
        edad: v.pipe(
            v.union([v.number(), v.string()]),
            v.transform(Number),
            v.number(),
            v.minValue(0, "La edad debe ser un número positivo.")
        ),
        cargo: v.pipe(
            v.string(),
            v.trim(),
            v.minLength(1, "El cargo es obligatorio."),
            v.maxLength(255)
        ),
        correo: v.pipe(
            v.string(),
            v.trim(),
            v.minLength(1, "El correo es obligatorio."),
            v.email("Correo no válido."),
            v.maxLength(255)
        )
    })
});

// ----- Reserva Empresa -----
const ReservaEmpresaSchema = v.object({
    tipoReserva: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "El tipo de reserva es obligatorio.")
    ),
    sucursalId: v.pipe(
        v.union([v.number(), v.string()]),
        v.transform(Number),
        v.number()
    ),
    fechaHora: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, "La fecha y hora son obligatorias.")
    ),
    bateriaMedicaIds: v.array(v.number()),
    examenAdicionalIds: v.array(v.number()),
    pruebaDrogasIds: v.array(v.number()),
    empresaInfo: EmpresaSchema,
    solicitanteInfo: SolicitanteSchema,
    trabajadorInfo: v.array(
        v.object({
            nombreT: v.pipe(
                v.string(),
                v.trim(),
                v.minLength(1, "El nombre es obligatorio."),
                v.maxLength(255)
            ),
            rutPasaporte: v.pipe(
                v.string(),
                v.trim(),
                v.minLength(1, "El RUT/Pasaporte es obligatorio."),
                rutOPasaporteValido,
                v.transform(normalizarRut)
            ),
            edad: v.pipe(
                v.union([v.number(), v.string()]),
                v.transform(Number),
                v.number(),
                v.minValue(0, "La edad debe ser un número positivo.")
            ),
            cargo: v.pipe(
                v.string(),
                v.trim(),
                v.minLength(1, "El cargo es obligatorio."),
                v.maxLength(255)
            )
        })
    )

});

// ----- Esquema principal (Union de ambos tipos) -----
export const ReservaSchema = v.union([
    ReservaParticularSchema,
    ReservaEmpresaSchema,
]);

// OPCIONAL: Puedes exportar los parsers así
export const validarReserva = v.parser(ReservaSchema);
