// --- estadisticas.js (backend API) ---
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Helpers de fechas (igual que antes)
function getWeekRange(fechaSemana) {
  const [yearStr, weekStr] = fechaSemana.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  const firstDay = new Date(year, 0, 1);
  const dayOfWeek = firstDay.getDay() || 7;
  const isoWeekStart = new Date(firstDay);
  isoWeekStart.setDate(firstDay.getDate() + (1 - dayOfWeek));
  const monday = new Date(isoWeekStart);
  monday.setDate(isoWeekStart.getDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    desde: monday.getTime(),
    hasta: sunday.getTime() + 86399999
  };
}
function getMonthRange(fechaMes) {
  const [yearStr, monthStr] = fechaMes.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const desde = new Date(year, month - 1, 1).getTime();
  const hasta = new Date(year, month, 0, 23, 59, 59, 999).getTime();
  return { desde, hasta };
}
function parseBigIntToNumber(obj) {
  if (Array.isArray(obj)) {
    return obj.map(parseBigIntToNumber);
  } else if (obj !== null && typeof obj === 'object') {
    const parsed = {};
    for (const key in obj) {
      if (typeof obj[key] === 'bigint') parsed[key] = Number(obj[key]);
      else parsed[key] = parseBigIntToNumber(obj[key]);
    }
    return parsed;
  }
  return obj;
}

const ESTADOS_TRABAJADOR = ['pendiente', 'asistio', 'no asistio', 'cancelado'];

// ========== Trabajadores agendados por fecha, estado trabajador y sucursal ==========
export async function trabajadoresAgendados(req, res) {
  const periodo = req.query.periodo || 'dia';
  const fecha = req.query.fecha;
  const usuario = req.usuario;

  let whereFecha = '';
  let params = [];

  if (periodo === 'dia' && fecha) {
    whereFecha = `AND strftime('%Y-%m-%d', r."fechaHora" / 1000, 'unixepoch') = ?`;
    params.push(fecha);
  } else if (periodo === 'semana' && fecha) {
    const { desde, hasta } = getWeekRange(fecha);
    whereFecha = `AND r."fechaHora" BETWEEN ? AND ?`;
    params.push(desde, hasta);
  } else if (periodo === 'mes' && fecha) {
    const { desde, hasta } = getMonthRange(fecha);
    whereFecha = `AND r."fechaHora" BETWEEN ? AND ?`;
    params.push(desde, hasta);
  }

  try {
    if (usuario.rol === 'admin') {
      const sucursales = await prisma.sucursal.findMany();
      const results = [];
      for (const sucursal of sucursales) {
        const sql = `
          SELECT 
            strftime('%Y-%m-%d', r."fechaHora" / 1000, 'unixepoch') AS fecha,
            rt.estado,
            COUNT(rt."id") AS cantidad
          FROM "Reserva" r
          JOIN "ReservaTrabajador" rt ON r."id" = rt."reservaId"
          WHERE r."fechaHora" IS NOT NULL
            AND r."sucursalId" = ?
            ${whereFecha}
          GROUP BY fecha, rt.estado
          ORDER BY fecha
        `;
        const datos = await prisma.$queryRawUnsafe(sql, sucursal.id, ...params);

        // Agrupa por fecha y estado de trabajador
        const agrupado = {};
        for (const row of datos) {
          if (!agrupado[row.fecha]) {
            agrupado[row.fecha] = Object.fromEntries(ESTADOS_TRABAJADOR.map(e => [e, 0]));
          }
          agrupado[row.fecha][row.estado] = Number(row.cantidad);
        }
        // Transforma a array [{fecha, pendiente, asistio, no asistio, cancelado}]
        const datosTransformados = Object.entries(agrupado).map(([fecha, estados]) => ({
          fecha,
          ...estados
        }));

        results.push({
          sucursal: sucursal.nombre || `Sucursal ${sucursal.id}`,
          datos: datosTransformados
        });
      }
      return res.json(results);
    }

    // No admin (usuario normal)
    const sql = `
      SELECT 
        strftime('%Y-%m-%d', r."fechaHora" / 1000, 'unixepoch') AS fecha,
        rt.estado,
        COUNT(rt."id") AS cantidad
      FROM "Reserva" r
      JOIN "ReservaTrabajador" rt ON r."id" = rt."reservaId"
      WHERE r."fechaHora" IS NOT NULL
        AND r."sucursalId" = ?
        ${whereFecha}
      GROUP BY fecha, rt.estado
      ORDER BY fecha
    `;
    params.unshift(usuario.sucursalId);
    const datos = await prisma.$queryRawUnsafe(sql, ...params);

    // Agrupa por fecha y estado trabajador
    const agrupado = {};
    for (const row of datos) {
      if (!agrupado[row.fecha]) {
        agrupado[row.fecha] = Object.fromEntries(ESTADOS_TRABAJADOR.map(e => [e, 0]));
      }
      agrupado[row.fecha][row.estado] = Number(row.cantidad);
    }
    const datosTransformados = Object.entries(agrupado).map(([fecha, estados]) => ({
      fecha,
      ...estados
    }));

    return res.json(datosTransformados);

  } catch (error) {
    console.error('Error en trabajadoresAgendados:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
}

// ========== RESUMEN POR ESTADO TRABAJADOR ==========
export async function resumenEstados(req, res) {
  const periodo = req.query.periodo || 'dia';
  const fecha = req.query.fecha;
  const usuario = req.usuario;

  let whereFecha = '';
  let params = [];

  if (periodo === 'dia' && fecha) {
    whereFecha = `AND strftime('%Y-%m-%d', r."fechaHora" / 1000, 'unixepoch') = ?`;
    params.push(fecha);
  } else if (periodo === 'semana' && fecha) {
    const { desde, hasta } = getWeekRange(fecha);
    whereFecha = `AND r."fechaHora" BETWEEN ? AND ?`;
    params.push(desde, hasta);
  } else if (periodo === 'mes' && fecha) {
    const { desde, hasta } = getMonthRange(fecha);
    whereFecha = `AND r."fechaHora" BETWEEN ? AND ?`;
    params.push(desde, hasta);
  }

  try {
    let whereSucursal = '';
    if (usuario.rol !== 'admin') {
      whereSucursal = `AND r."sucursalId" = ?`;
      params.push(usuario.sucursalId);
    }

    const sql = `
      SELECT rt.estado, COUNT(*) as cantidad
      FROM "Reserva" r
      JOIN "ReservaTrabajador" rt ON r."id" = rt."reservaId"
      WHERE 1=1 ${whereFecha} ${whereSucursal}
      GROUP BY rt.estado
    `;

    const resultado = await prisma.$queryRawUnsafe(sql, ...params);

    // Asegura que todos los estados estén presentes en la respuesta, incluso si están en 0
    const resultadoFinal = ESTADOS_TRABAJADOR.map(estado => {
      const encontrado = resultado.find(r => r.estado === estado);
      return { estado, cantidad: encontrado ? Number(encontrado.cantidad) : 0 };
    });

    res.json(parseBigIntToNumber(resultadoFinal));
  } catch (error) {
    console.error('Error en resumenEstados:', error);
    res.status(500).json({ error: 'Error al obtener resumen por estado' });
  }
}
