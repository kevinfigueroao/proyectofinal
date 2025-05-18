import { Router } from 'express';
import { getDashboard } from '../controladores/dashboard.js';
const routerD = Router();
routerD.get('/', getDashboard);
export default routerD;
