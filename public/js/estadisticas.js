// --- estadisticas.js (frontend) ---
const apiUrl = '/api/estadisticas';

const ESTADOS_TRABAJADOR = ['pendiente', 'asistio', 'no asistio', 'cancelado'];
const ESTADO_COLORES = {
  pendiente: '#FFFF00',
  asistio: '#98cb4a',
  'no asistio': '#fbbf24',
  cancelado: '#d65656'
};

function cerrarSesion() {
  sessionStorage.removeItem('token');
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', function () {
  const periodoSel = document.getElementById('periodoEstadistica');
  const fechaInput = document.getElementById('selectorFecha');

  function setDefaultFecha() {
    const now = new Date();

    if (periodoSel.value === 'dia') {
      fechaInput.type = 'date';
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      fechaInput.value = `${yyyy}-${mm}-${dd}`;
    }
    if (periodoSel.value === 'semana') {
      fechaInput.type = 'week';
      const yyyy = now.getFullYear();
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const pastDaysOfYear = (now - firstDay) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
      fechaInput.value = `${yyyy}-W${String(weekNumber).padStart(2, '0')}`;
    }
    if (periodoSel.value === 'mes') {
      fechaInput.type = 'month';
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      fechaInput.value = `${yyyy}-${mm}`;
    }
  }

  periodoSel.addEventListener('change', function () {
    setDefaultFecha();
    cargarEstadisticas();
  });

  fechaInput.addEventListener('change', cargarEstadisticas);

  setDefaultFecha();
  cargarEstadisticas();
});

async function cargarEstadisticas() {
  const periodo = document.getElementById('periodoEstadistica').value;
  const fecha = document.getElementById('selectorFecha').value;
  const token = sessionStorage.getItem('token');
  const chartsContainer = document.getElementById('charts-container');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  if (!fecha) {
    chartsContainer.innerHTML = `<div style="color:#a44;text-align:center;padding:20px;">Selecciona un ${periodo}.</div>`;
    document.getElementById('total-trabajadores').innerHTML = '';
    document.getElementById('resumen-estados').innerHTML = '';
    return;
  }

  try {
    // 1. Trabajadores agendados por periodo y fecha
    const res = await fetch(`${apiUrl}/agendados?periodo=${periodo}&fecha=${fecha}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    const datos = await res.json();

    // 2. Resumen por estado trabajador
    const res2 = await fetch(`${apiUrl}/estados?periodo=${periodo}&fecha=${fecha}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const resumenEstados = await res2.json();

    mostrarGraficos(datos, periodo, fecha);
    mostrarResumen(resumenEstados);
  } catch (err) {
    chartsContainer.innerHTML = `<div style="color:#a44;text-align:center;padding:20px;">No se pudo cargar estadísticas.</div>`;
    document.getElementById('total-trabajadores').innerHTML = '';
    document.getElementById('resumen-estados').innerHTML = '';
  }
}

function mostrarGraficos(datos, periodo, fecha) {
  const chartsContainer = document.getElementById('charts-container');
  chartsContainer.innerHTML = '';

  let sucursalesData;
  if (Array.isArray(datos) && datos.length && datos[0].sucursal && Array.isArray(datos[0].datos)) {
    sucursalesData = datos;
  } else if (Array.isArray(datos) && datos.length && datos[0].fecha) {
    sucursalesData = [{ sucursal: 'Sucursal', datos }];
  } else {
    sucursalesData = [{ sucursal: 'Sucursal', datos: datos ? [datos] : [] }];
  }

  let totalTrabajadores = 0;

  sucursalesData.forEach(({ sucursal = 'Sucursal', datos }) => {
    const labels = datos.map(d => d.fecha || "Sin fecha");
    // Serie para cada estado (mismo orden para el stack)
    const pendientes = datos.map(d => d.pendiente || 0);
    const asistidos = datos.map(d => d.asistio || 0);
    const noAsistidos = datos.map(d => d['no asistio'] || 0);
    const cancelados = datos.map(d => d.cancelado || 0);

    const totalSucursal = pendientes.reduce((a, b) => a + b, 0) +
      asistidos.reduce((a, b) => a + b, 0) +
      noAsistidos.reduce((a, b) => a + b, 0) +
      cancelados.reduce((a, b) => a + b, 0);
    totalTrabajadores += totalSucursal;

    const card = document.createElement('div');
    card.className = 'apexcharts-card';

    const titulo = document.createElement('div');
    titulo.className = 'sucursal-titulo';
    titulo.innerText = sucursal;
    card.appendChild(titulo);

    const totalDiv = document.createElement('div');
    totalDiv.className = 'sucursal-total';
    totalDiv.innerText = `Total trabajadores: ${totalSucursal}`;
    card.appendChild(totalDiv);

    const chartDiv = document.createElement('div');
    chartDiv.style.width = '100%';
    chartDiv.style.minHeight = '250px';
    card.appendChild(chartDiv);

    const options = {
      chart: { type: 'bar', height: 230, stacked: true, toolbar: { show: false } },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '45%'
        }
      },
      dataLabels: {
        enabled: true,
        position: 'top',
        offsetY: -6,
        style: {
          fontSize: '1em',
          fontWeight: 'bold',
          colors: ['#111']
        },
        formatter: function (val) {
          // Sólo muestra si el valor es mayor a 0
          return val > 0 ? val : '';
        }
      },
      xaxis: { categories: labels },
      yaxis: {
        title: { text: 'Trabajadores', style: { fontWeight: 700 } },
        min: 0
      },
      series: [
        { name: 'pendiente', data: pendientes, color: ESTADO_COLORES.pendiente },
        { name: 'asistio', data: asistidos, color: ESTADO_COLORES.asistio },
        { name: 'no asistio', data: noAsistidos, color: ESTADO_COLORES['no asistio'] },
        { name: 'cancelado', data: cancelados, color: ESTADO_COLORES.cancelado }
      ],
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        markers: { width: 16, height: 16, radius: 2 }
      },
      tooltip: { y: { formatter: val => val } }
    };

    chartsContainer.appendChild(card);
    new ApexCharts(chartDiv, options).render();
  });
}

function mostrarResumen(datos) {
  const contenedor = document.getElementById('resumen-estados');
  contenedor.innerHTML = '';

  const total = datos.reduce((acc, d) => acc + Number(d.cantidad), 0);

  datos.forEach(({ estado, cantidad }) => {
    const porcentaje = total ? Math.round((cantidad / total) * 100) : 0;

    // Crear el div para cada estado
    const div = document.createElement('div');
    div.classList.add('estado-item');

    div.innerHTML = `
      <div class="estado-nombre">${capitalize(estado)} (${cantidad})</div>
      <div class="estado-barra">
        <div class="estado-barra-fill estado-${estado.replace(' ', '-')}" style="width: ${porcentaje}%; background:${ESTADO_COLORES[estado] || '#ccc'}"></div>
      </div>
      <div>${porcentaje}%</div>
    `;
    contenedor.appendChild(div);
  });
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
