import { Router } from 'express';
import { autenticarJWT } from '../middlewares/auth.js';
import { trabajadoresAgendados, resumenEstados } from '../controladores/estadisticas.js';

const router = Router();

router.get('/agendados', autenticarJWT, trabajadoresAgendados);
router.get('/estados', autenticarJWT, resumenEstados);

export default router;
