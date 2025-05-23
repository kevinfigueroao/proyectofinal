import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import reservasRouter from './rutas/reservas.js';
import dashboardRouter from './rutas/dashboard.js';
import exportRouter from './rutas/export.js';
import catalogosRouter from './rutas/catalogos.js';

dotenv.config();
const app = express();
app.use(express.json());
// Servir frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
// Rutas
app.use('/api/catalogos', catalogosRouter);
app.use('/api', reservasRouter);

app.use('/api/dashboard', dashboardRouter);
app.use('/api/export', exportRouter);
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Error interno del servidor' }); });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));