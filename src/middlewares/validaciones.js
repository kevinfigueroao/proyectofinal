// src/middlewares/validarComponentePeticion.js
import { parse } from 'valibot';

export function validarComponentePeticion(componente, esquema, nombreProp = componente) {
  return (req, res, next) => {
    try {
      console.log("REQ.BODY:", JSON.stringify(req.body, null, 2));

      const datosValidados = parse(esquema, req[componente]);
      req[nombreProp] = datosValidados;
      next();
    } catch (ex) {
      res.status(400).json({ error: ex.issues?.[0]?.message || ex.message });
    }
  };
}
