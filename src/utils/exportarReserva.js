import ExcelJS from 'exceljs';

export async function generarExcelReservas  (reservas, res)  {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reservas');

  worksheet.columns = [
    { header: 'Tipo', key: 'tipo', width: 20 },
    { header: 'Fecha y Hora', key: 'fechaHora', width: 25 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Sucursal', key: 'sucursal', width: 20 },
    { header: 'Empresa', key: 'empresa', width: 30 },
    { header: 'Solicitante', key: 'solicitante', width: 30 },
    { header: 'Trabajadores', key: 'trabajadores', width: 50 },
    { header: 'Baterías Médicas', key: 'baterias', width: 30 },
    { header: 'Exámenes Adicionales', key: 'examenes', width: 30 },
    { header: 'Pruebas de Drogas', key: 'pruebas', width: 30 },
  ];

  reservas.forEach(r => {
  const trabajadores = r.reservasTrabajador
    .map(rt => rt.trabajador?.nombre || '')
    .join(', ');

  const baterias = r.bateriasMedicas.map(b => b.nombre).join(', ');
  const examenes = r.examenesAdicionales.map(e => e.nombre).join(', ');
  const pruebas = r.pruebasDrogas.map(p => p.nombre).join(', ');

  worksheet.addRow({
    id: r.id,
    tipo: r.tipoReserva,
    fechaHora: r.fechaHora.toISOString(),
    estado: r.estado,
    sucursal: r.sucursal?.nombre || '',
    empresa: r.empresa?.nombre || '',
    solicitante: r.solicitante?.nombre || '',
    trabajadores,
    baterias,
    examenes,
    pruebas,
  });
});

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="reservas.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
};

//module.exports = { generarExcelReservas };
