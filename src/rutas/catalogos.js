import { Router } from 'express';
import {
  getSucursales,
  getBaterias,
  getExamenes,
  getPruebas
} from '../controladores/catalogos.js';

const router = Router();
router.get('/sucursales', getSucursales);
router.get('/baterias',  getBaterias);
router.get('/examenes', getExamenes);
router.get('/pruebas',   getPruebas);

export default router;
