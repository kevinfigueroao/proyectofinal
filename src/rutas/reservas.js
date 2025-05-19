import { Router } from 'express';
import { crearReserva, listarReservas, modificarReserva, cancelarReserva } from '../controladores/reservas.js';
import { validarComponentePeticion } from '../middlewares/validaciones.js';
import { ReservaSchema } from "../validaciones/reservaSchema.js";
import router from './catalogos.js';

const routerR = Router();


router.post('/reservas', validarComponentePeticion('body', ReservaSchema, 'body'), crearReserva);
router.get('/reservas', listarReservas);
routerR.put('/:id', validarComponentePeticion('body', ReservaSchema), modificarReserva);
routerR.patch('/:id/cancelar', cancelarReserva);
export default router;