import { Router } from 'express';
import { crearReserva, listarReservas, modificarReserva, cancelarReserva, obtenerReservaPorId } from '../controladores/reservas.js';
import { validarComponentePeticion } from '../middlewares/validarComponentePeticion.js';
import { ReservaSchema } from "../validaciones/reservaSchema.js";
import { autenticarJWT } from '../middlewares/auth.js';
import { marcarAsistenciaTrabajador } from '../controladores/reservas.js';


const router = Router();

// NOTA: las rutas aquí NO deben tener el prefijo /api, eso se agrega al usar el router en el index.js

// rutas/reservas.js
router.post('/', validarComponentePeticion('body', ReservaSchema, 'body'), crearReserva);
router.get('/', autenticarJWT, listarReservas);
router.get('/:id', obtenerReservaPorId);
router.put('/:id', modificarReserva);
router.patch('/:id/cancelar', cancelarReserva);

// Después
router.patch('/:reservaId/trabajadores/:trabajadorId/asistio', autenticarJWT, marcarAsistenciaTrabajador);
 // <<--- ESTA ES LA QUE TE FALTA o debes asegurar que esté


export default router;



