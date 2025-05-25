import express from 'express';
import { crearUsuario, listarUsuarios } from '../controladores/usuarios.js';
import { autenticarJWT, soloAdmin } from '../middlewares/auth.js';


const router = express.Router();

router.post('/', autenticarJWT, soloAdmin, crearUsuario);
router.get('/', autenticarJWT, soloAdmin, listarUsuarios);

export default router;
