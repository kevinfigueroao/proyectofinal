
import { Router } from 'express';
import { exportarReservas } from '../controladores/exportarReserva.js';
const router = Router();

router.get('/exportar', exportarReservas);

export default router;

