import { Router } from 'express';
import { obtenerTodasBateriasMedicas, obtenerTodosExamenesAdicionales, obtenerTodasPruebasDrogas } from '../controladores/examenes.js';
const router = Router();

router.get("/baterias-medicas", obtenerTodasBateriasMedicas);
router.get("/examenes-adicionales", obtenerTodosExamenesAdicionales);
router.get("/pruebas-drogas", obtenerTodasPruebasDrogas);

export default router;
