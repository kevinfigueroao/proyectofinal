import ExcelJS from 'exceljs';
import dayjs from 'dayjs'; // Asegúrate de tener instalado dayjs: npm install dayjs

export async function generarExcelReservas(reservas, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reservas');

  worksheet.columns = [
    { header: 'Tipo', key: 'tipo', width: 20 },
    { header: 'Fecha y Hora', key: 'fechaHora', width: 25 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Sucursal', key: 'sucursal', width: 20 },
    { header: 'Empresa', key: 'empresa', width: 30 },
    { header: 'Trabajador', key: 'trabajador', width: 30 },
    { header: 'RUT/Pasaporte', key: 'rutPasaporte', width: 25 },
    { header: 'Baterías Médicas', key: 'baterias', width: 30 },
    { header: 'Exámenes Adicionales', key: 'examenes', width: 30 },
    { header: 'Pruebas de Drogas', key: 'pruebas', width: 30 },
  ];

  // Ordenar reservas por fecha
  reservas.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

  reservas.forEach(r => {
    const baterias = r.bateriasMedicas.map(b => b.nombre).join(', ');
    const examenes = r.examenesAdicionales.map(e => e.nombre).join(', ');
    const pruebas = r.pruebasDrogas.map(p => p.nombre).join(', ');
    const fechaHoraFormateada = dayjs(r.fechaHora).format('DD-MM-YYYY HH:mm');

    const trabajadores = r.reservasTrabajador || [];

    // Ordenar trabajadores por nombre
    trabajadores.sort((a, b) => {
      const nombreA = a.trabajador?.nombre?.toLowerCase() || '';
      const nombreB = b.trabajador?.nombre?.toLowerCase() || '';
      return nombreA.localeCompare(nombreB);
    });

    if (trabajadores.length === 0) {
      worksheet.addRow({
        tipo: r.tipoReserva,
        fechaHora: fechaHoraFormateada,
        estado: r.estado,
        sucursal: r.sucursal?.nombre || '',
        empresa: r.empresa?.nombre || '',
        trabajador: '',
        rutPasaporte: '',
        baterias,
        examenes,
        pruebas,
      });
    } else {
      trabajadores.forEach(rt => {
        worksheet.addRow({
          tipo: r.tipoReserva,
          fechaHora: fechaHoraFormateada,
          estado: r.estado,
          sucursal: r.sucursal?.nombre || '',
          empresa: r.empresa?.nombre || '',
          trabajador: rt.trabajador?.nombre || '',
          rutPasaporte: rt.trabajador?.rutPasaporte || '',
          baterias,
          examenes,
          pruebas,
        });
      });
    }
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="reservas.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
}
