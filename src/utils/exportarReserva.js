import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

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
    { header: 'Correo Trabajador', key: 'correo', width: 30 },
    { header: 'Baterías Médicas', key: 'baterias', width: 30 },
    { header: 'Exámenes Adicionales', key: 'examenes', width: 30 },
    { header: 'Pruebas de Drogas', key: 'pruebas', width: 30 },
  ];

  // Filtros Excel
  worksheet.autoFilter = 'A1:K1';

  // Formato cabecera
  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCE5FF' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  reservas.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
  reservas.forEach(r => {
    const baterias = r.bateriasMedicas.map(b => b.nombre).join(', ');
    const examenes = r.examenesAdicionales.map(e => e.nombre).join(', ');
    const pruebas = r.pruebasDrogas.map(p => p.nombre).join(', ');
    const fechaHoraFormateada = dayjs(r.fechaHora).format('DD-MM-YYYY HH:mm');
    const trabajadores = r.reservasTrabajador || [];
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
        correo: '',
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
          correo: rt.trabajador?.correo || '',
          baterias,
          examenes,
          pruebas,
        });
      });
    }
  });

  // Nombre de archivo dinámico
  const nombreSucursal = reservas[0]?.sucursal?.nombre?.replace(/\s+/g, '_') || 'todas';
  const desde = reservas.length ? dayjs(reservas[0].fechaHora).format('DD-MM-YYYY') : '';
  const hasta = reservas.length ? dayjs(reservas[reservas.length - 1].fechaHora).format('DD-MM-YYYY') : '';
  const nombreArchivo = `reservas_${nombreSucursal}_${desde}_a_${hasta}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

  await workbook.xlsx.write(res);
  res.end();
}
