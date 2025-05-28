// src/middlewares/validarComponentePeticion.js
import { safeParse } from "valibot"; // O el método de valibot para validar
import { ReservaSchema } from "../validaciones/reservaSchema.js";

export function validarComponentePeticion(tipo, esquema, fuente = 'body') {
  return (req, res, next) => {
    const { success, error } = safeParse(esquema, req[fuente]);
    if (!success) {
      // Si error tiene detalles, puedes devolver el primero o todos
      return res.status(400).json({
        error: error?.issues?.map(e => e.message).join('\n') || "Error de validación"
      });
    }
    next();
  };
}
