import { Router } from 'express';
import { exportarCSV } from '../controladores/export.js';
const routerE = Router();
routerE.get('/', exportarCSV);
export default routerE;