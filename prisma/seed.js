import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Sucursales
  await prisma.sucursal.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'Concepción' } });
  await prisma.sucursal.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Santiago' } });
  await prisma.sucursal.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Antofagasta' } });
  await prisma.sucursal.upsert({ where: { id: 4 }, update: {}, create: { nombre: 'Viña del Mar' } });

  // Baterías médicas
  await prisma.bateriaMedica.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'Altura Física' } });
  await prisma.bateriaMedica.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Espacios Confinados' } });
  await prisma.bateriaMedica.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Conductor' } });
  await prisma.bateriaMedica.upsert({ where: { id: 4 }, update: {}, create: { nombre: 'Operador' } });
  await prisma.bateriaMedica.upsert({ where: { id: 5 }, update: {}, create: { nombre: 'Básico' } });

  // Exámenes adicionales
  await prisma.examenAdicional.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'RX Tórax' } });
  await prisma.examenAdicional.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Glicemia' } });
  await prisma.examenAdicional.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Creatinina' } });

  // Pruebas de drogas
  await prisma.pruebaDrogas.upsert({ where: { id: 1 }, update: {}, create: { nombre: 'Marihuana' } });
  await prisma.pruebaDrogas.upsert({ where: { id: 2 }, update: {}, create: { nombre: 'Cocaína' } });
  await prisma.pruebaDrogas.upsert({ where: { id: 3 }, update: {}, create: { nombre: 'Anfetamina' } });
  await prisma.pruebaDrogas.upsert({ where: { id: 4 }, update: {}, create: { nombre: 'Alcohol' } });

  // Hash de contraseñas distintas
  const adminPass     = await bcrypt.hash('AdminPass2024', 10);
  const concePass     = await bcrypt.hash('Conce2024', 10);
  const santiagoPass  = await bcrypt.hash('Santiago2024', 10);
  const antofaPass    = await bcrypt.hash('Antofa2024', 10);
  const vinaPass      = await bcrypt.hash('Vina2024', 10);

  // Admin
 await prisma.usuario.upsert({
  where: { username: 'admin' },
  update: {},
  create: {
    username: 'admin',
    contrasena: adminPass,
    rol: 'admin'
  }
});

// Sucursal Concepción
await prisma.usuario.upsert({
  where: { username: 'concepcion' },
  update: {},
  create: {
    username: 'concepcion',
    contrasena: concePass,
    rol: 'sucursal',
    sucursal: { connect: { id: 1 } }
  }
});

// Sucursal Santiago
await prisma.usuario.upsert({
  where: { username: 'santiago' },
  update: {},
  create: {
    username: 'santiago',
    contrasena: santiagoPass,
    rol: 'sucursal',
    sucursal: { connect: { id: 2 } }
  }
});

// Sucursal Antofagasta
await prisma.usuario.upsert({
  where: { username: 'antofagasta' },
  update: {},
  create: {
    username: 'antofagasta',
    contrasena: antofaPass,
    rol: 'sucursal',
    sucursal: { connect: { id: 3 } }
  }
});

// Sucursal Viña del Mar
await prisma.usuario.upsert({
  where: { username: 'vina' },
  update: {},
  create: {
    username: 'vina',
    contrasena: vinaPass,
    rol: 'sucursal',
    sucursal: { connect: { id: 4 } }
  }
});

}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
