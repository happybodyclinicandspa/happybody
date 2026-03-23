require('dotenv').config();
const mongoose   = require('mongoose');
const Service    = require('../models/Service');
const Specialist = require('../models/Specialist');

// ─────────────────────────────────────────────────────────────
//  DATOS — SERVICIOS
//  Fuente: Menu_Servicios_Happy_Body.pdf
//  Regla: si no tiene duración definida en el PDF → 60 min
// ─────────────────────────────────────────────────────────────
const SERVICES = [

  // ── TOXINA BOTULÍNICA ──────────────────────────────────────
  // Botox/Baby Botox: frente+entrecejo+patas de gallo = 20 min → redondeamos a 30
  { serviceId:'s01', name:'Botox / Baby Botox (3 zonas)',  category:'c1', categoryName:'Toxina Botulínica',       categoryColor:'#7a3555', durationMinutes:30  },
  { serviceId:'s02', name:'Botox Full Face',               category:'c1', categoryName:'Toxina Botulínica',       categoryColor:'#7a3555', durationMinutes:60  },
  { serviceId:'s03', name:'Botox Cuello Nefertiti',        category:'c1', categoryName:'Toxina Botulínica',       categoryColor:'#7a3555', durationMinutes:30  },

  // ── RELLENOS CON ÁCIDO HIALURÓNICO ────────────────────────
  { serviceId:'s04', name:'Surcos nasogenianos (1 jeringa)',category:'c2', categoryName:'Rellenos Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:30  },
  { serviceId:'s05', name:'Surcos nasogenianos (2 jeringas)',category:'c2', categoryName:'Rellenos Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:30  },
  { serviceId:'s06', name:'Labios',                        category:'c2', categoryName:'Rellenos Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:60  },
  { serviceId:'s07', name:'Región temporal (2 jeringas)',  category:'c2', categoryName:'Rellenos Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:30  },
  { serviceId:'s08', name:'Relleno mixto labios + surcos', category:'c2', categoryName:'Rellenos Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:60  },

  // ── BIOESTIMULACIÓN ───────────────────────────────────────
  { serviceId:'s09', name:'Radiesse',                      category:'c3', categoryName:'Bioestimulación',         categoryColor:'#5a6e9b', durationMinutes:60  },
  { serviceId:'s10', name:'Sculptra',                      category:'c3', categoryName:'Bioestimulación',         categoryColor:'#5a6e9b', durationMinutes:60  },
  { serviceId:'s11', name:'Lipofilling facial nanofat',    category:'c3', categoryName:'Bioestimulación',         categoryColor:'#5a6e9b', durationMinutes:180 },

  // ── CIRUGÍA ESTÉTICA MENOR ─────────────────────────────────
  { serviceId:'s12', name:'Blefaroplastia láser superior', category:'c4', categoryName:'Cirugía Estética Menor',  categoryColor:'#a04030', durationMinutes:120 },
  { serviceId:'s13', name:'Lipopapada láser',              category:'c4', categoryName:'Cirugía Estética Menor',  categoryColor:'#a04030', durationMinutes:120 },

  // ── CONTROL METABÓLICO ────────────────────────────────────
  { serviceId:'s14', name:'Control de peso – Paciente nuevo',   category:'c5', categoryName:'Control Metabólico', categoryColor:'#b8894a', durationMinutes:60  },
  { serviceId:'s15', name:'Control de peso – Consecutivo',      category:'c5', categoryName:'Control Metabólico', categoryColor:'#b8894a', durationMinutes:30  },
  { serviceId:'s16', name:'Lapicera 0.25–0.5 mg',               category:'c5', categoryName:'Control Metabólico', categoryColor:'#b8894a', durationMinutes:30  },
  { serviceId:'s17', name:'Lapicera 1 mg',                      category:'c5', categoryName:'Control Metabólico', categoryColor:'#b8894a', durationMinutes:30  },

  // ── PROCEDIMIENTOS FACIALES ────────────────────────────────
  { serviceId:'s18', name:'Peeling enzimático',            category:'c6', categoryName:'Procedimientos Faciales', categoryColor:'#c0394a', durationMinutes:30  },
  { serviceId:'s19', name:'Peeling químico',               category:'c6', categoryName:'Procedimientos Faciales', categoryColor:'#c0394a', durationMinutes:30  },
  { serviceId:'s20', name:'Hilos PDO',                     category:'c6', categoryName:'Procedimientos Faciales', categoryColor:'#c0394a', durationMinutes:60  },
  { serviceId:'s21', name:'Subcisión acné',                category:'c6', categoryName:'Procedimientos Faciales', categoryColor:'#c0394a', durationMinutes:30  },

  // ── LÁSER CO2 ─────────────────────────────────────────────
  { serviceId:'s22', name:'CO2 – Rejuvenecimiento facial', category:'c7', categoryName:'Láser CO2',               categoryColor:'#3a6a8a', durationMinutes:30  },
  { serviceId:'s23', name:'CO2 – Rejuvenecimiento vaginal',category:'c7', categoryName:'Láser CO2',               categoryColor:'#3a6a8a', durationMinutes:60  },
  { serviceId:'s24', name:'CO2 – Poros rostro',            category:'c7', categoryName:'Láser CO2',               categoryColor:'#3a6a8a', durationMinutes:30  },
  { serviceId:'s25', name:'CO2 – Cicatrices',              category:'c7', categoryName:'Láser CO2',               categoryColor:'#3a6a8a', durationMinutes:30  },
  { serviceId:'s26', name:'CO2 – Estrías (por área)',      category:'c7', categoryName:'Láser CO2',               categoryColor:'#3a6a8a', durationMinutes:60  },

  // ── OTROS PROCEDIMIENTOS ──────────────────────────────────
  { serviceId:'s27', name:'PRP',                           category:'c8', categoryName:'Otros Procedimientos',    categoryColor:'#4a7a6e', durationMinutes:30  },
  { serviceId:'s28', name:'PRF',                           category:'c8', categoryName:'Otros Procedimientos',    categoryColor:'#4a7a6e', durationMinutes:30  },
  { serviceId:'s29', name:'Sueroterapia',                  category:'c8', categoryName:'Otros Procedimientos',    categoryColor:'#4a7a6e', durationMinutes:30  },
  { serviceId:'s30', name:'Láser melasma',                 category:'c8', categoryName:'Otros Procedimientos',    categoryColor:'#4a7a6e', durationMinutes:30  },
  { serviceId:'s31', name:'Endoláser venoso',              category:'c8', categoryName:'Otros Procedimientos',    categoryColor:'#4a7a6e', durationMinutes:30  },

  // ── DEPILACIÓN LÁSER ──────────────────────────────────────
  // Todas las especialistas lo realizan — sin tiempo definido en PDF → 60 min
  { serviceId:'s32', name:'Depilación láser – Full face',  category:'c9', categoryName:'Depilación Láser',        categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s33', name:'Depilación láser – Bozo',       category:'c9', categoryName:'Depilación Láser',        categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s34', name:'Depilación láser – Barba',      category:'c9', categoryName:'Depilación Láser',        categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s35', name:'Depilación láser – Brazos',     category:'c9', categoryName:'Depilación Láser',        categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s36', name:'Depilación láser – Piernas completas', category:'c9', categoryName:'Depilación Láser', categoryColor:'#7a4a9b', durationMinutes:60  },
  { serviceId:'s37', name:'Depilación láser – Bikini',     category:'c9', categoryName:'Depilación Láser',        categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s38', name:'Depilación láser – Full íntimo',category:'c9', categoryName:'Depilación Láser',        categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s39', name:'Depilación láser – Espalda',    category:'c9', categoryName:'Depilación Láser',        categoryColor:'#7a4a9b', durationMinutes:30  },

  // ── ESTÉTICA CORPORAL ─────────────────────────────────────
  { serviceId:'s40', name:'Drenaje linfático',             category:'c10', categoryName:'Estética Corporal',      categoryColor:'#4a8a5a', durationMinutes:30  },
  { serviceId:'s41', name:'Masaje reductor',               category:'c10', categoryName:'Estética Corporal',      categoryColor:'#4a8a5a', durationMinutes:30  },
  { serviceId:'s42', name:'Liposonix',                     category:'c10', categoryName:'Estética Corporal',      categoryColor:'#4a8a5a', durationMinutes:60  },

  // ── LIMPIEZA FACIAL ───────────────────────────────────────
  { serviceId:'s43', name:'Limpieza facial express',       category:'c11', categoryName:'Limpieza Facial',        categoryColor:'#8a6a4a', durationMinutes:30  },
  { serviceId:'s44', name:'Limpieza facial profunda',      category:'c11', categoryName:'Limpieza Facial',        categoryColor:'#8a6a4a', durationMinutes:60  },
  { serviceId:'s45', name:'Microdermoabrasión',            category:'c11', categoryName:'Limpieza Facial',        categoryColor:'#8a6a4a', durationMinutes:30  },

  // ── FACIALES ESPECIALIZADOS ────────────────────────────────
  { serviceId:'s46', name:'PDRN salmón',                   category:'c12', categoryName:'Faciales Especializados',categoryColor:'#6a4a8a', durationMinutes:60  },
  { serviceId:'s47', name:'Exoglow',                       category:'c12', categoryName:'Faciales Especializados',categoryColor:'#6a4a8a', durationMinutes:60  },
  { serviceId:'s48', name:'Exosomas',                      category:'c12', categoryName:'Faciales Especializados',categoryColor:'#6a4a8a', durationMinutes:60  },

  // ── ELECTROCAUTERIZACIÓN ──────────────────────────────────
  { serviceId:'s49', name:'Electrocauterización',          category:'c13', categoryName:'Otros',                  categoryColor:'#6a6a6a', durationMinutes:60  },

  // ── CAPILAR ───────────────────────────────────────────────
  { serviceId:'s50', name:'Mesoterapia capilar',           category:'c13', categoryName:'Otros',                  categoryColor:'#6a6a6a', durationMinutes:60  },
  { serviceId:'s51', name:'PRP capilar',                   category:'c13', categoryName:'Otros',                  categoryColor:'#6a6a6a', durationMinutes:60  },

  // ── EVALUACIONES ──────────────────────────────────────────
  { serviceId:'s52', name:'Evaluación',                    category:'c14', categoryName:'Evaluaciones',           categoryColor:'#2a6a7a', durationMinutes:60  },
  { serviceId:'s53', name:'Reevaluación',                  category:'c14', categoryName:'Evaluaciones',           categoryColor:'#2a6a7a', durationMinutes:60  },
];

// ─────────────────────────────────────────────────────────────
//  HELPERS — arrays de IDs agrupados por tipo para asignar
//  fácilmente a las especialistas
// ─────────────────────────────────────────────────────────────

// Depilación láser — TODAS las especialistas la realizan
const DEP_LASER = ['s32','s33','s34','s35','s36','s37','s38','s39'];

// Servicios base que hacen las esteticistas (no la doctora)
const ESTETICA_BASE = [
  ...DEP_LASER,
  's27',  // PRP
  's28',  // PRF
  's40',  // Drenaje linfático
  's41',  // Masaje reductor
  's42',  // Liposonix
  's43',  // Limpieza express
  's52',  // Evaluación
  's53',  // Reevaluación
];

// ─────────────────────────────────────────────────────────────
//  DATOS — ESPECIALISTAS
//  Fuente: Happy_Body_Info_y_servicios.pdf
//
//  NOMBRES:
//    sp1 → Dra. Yesica (mantiene nombre, es la doctora principal)
//    sp2 → "Esteticista 1" (Stephany — la clienta no quiere nombre)
//    sp3 → "Esteticista 2" (Astrid)
//    sp4 → "Esteticista 3" (Sofía)
//    sp5 → "Esteticista 4" (Hannia)
//
//  CORRECCIONES DE HORARIO:
//    · Stephany (sp2): Lunes, Martes, VIERNES desde las 11:00 am + Sábado 3:30 pm
//      (antes estaba Viernes desde 3:30 — el PDF dice 11:00)
//    · SÁBADO: todas aparecen (Dra. Yesica 11am, demás 11am o 3:30pm según PDF)
//    · Hannia (sp5): solo sábados 11am-7pm (correcto en PDF)
//
//  workDays: 0=Dom 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie 6=Sáb
//  startHours/endHours: formato decimal (15.5 = 15:30)
// ─────────────────────────────────────────────────────────────
const SPECIALISTS = [
  // ── Dra. Yesica Valdés ──────────────────────────────────
  {
    specialistId: 'sp1',
    name:         'Dra. Yesica Valdés',
    role:         'Medicina Estética · Directora',
    initials:     'DY',
    color:        '#9b4f6e',
    services: [
      // Toxina botulínica
      's01','s02','s03',
      // Rellenos AH
      's04','s05','s06','s07','s08',
      // Bioestimulación
      's09','s10','s11',
      // Cirugía estética menor
      's12','s13',
      // Control metabólico
      's14','s15','s16','s17',
      // Procedimientos faciales
      's18','s19','s20','s21',
      // Láser CO2
      's22','s23','s24','s25','s26',
      // Otros
      's29','s31',
      // Evaluaciones
      's52','s53',
    ],
    workDays:   [1,2,3,4,5,6],
    startHours: new Map([['1',15.5],['2',16],['3',15.5],['4',15.5],['5',15.5],['6',11]]),
    endHours:   new Map([['1',19],  ['2',19],['3',19],  ['4',19],  ['5',19],  ['6',19]]),
    scheduleDisplay: new Map([
      ['Lunes',    '3:30 – 7:00 pm'],
      ['Martes',   '4:00 – 7:00 pm'],
      ['Mié–Vie',  '3:30 – 7:00 pm'],
      ['Sábado',   '11:00 am – 7:00 pm'],
    ]),
    availability: 'high',
  },

  // ── Esteticista 1 (Stephany Miguel) ─────────────────────
  // Horario CORRECTO: Lun, Mar, VIE desde 11am · Sáb desde 3:30pm
  {
    specialistId: 'sp2',
    name:         'Esteticista 1',
    role:         'Estética Integral',
    initials:     'E1',
    color:        '#c0394a',
    services: [
      ...DEP_LASER,
      's27',  // PRP
      's28',  // PRF
      's40',  // Drenaje linfático
      's41',  // Masaje reductor
      's22',  // CO2 facial (lo hace según PDF)
      's43',  // Limpieza facial express
      's44',  // Limpieza facial profunda
      's45',  // Microdermoabrasión
      // Control de peso
      's14','s15','s16','s17',
      // Evaluaciones
      's52','s53',
    ],
    workDays:   [1,2,5,6],
    // Lun=1 Mar=2 desde 11am | Vie=5 desde 11am | Sáb=6 desde 3:30pm
    startHours: new Map([['1',11],['2',11],['5',11],['6',15.5]]),
    endHours:   new Map([['1',19],['2',19],['5',19],['6',19]]),
    scheduleDisplay: new Map([
      ['Lun, Mar & Vie', '11:00 am – 7:00 pm'],
      ['Sábado',         '3:30 – 7:00 pm'],
    ]),
    availability: 'high',
  },

  // ── Esteticista 2 (Astrid Miranda) ──────────────────────
  {
    specialistId: 'sp3',
    name:         'Esteticista 2',
    role:         'Estética Clínica',
    initials:     'E2',
    color:        '#4a7a6e',
    services: [
      ...DEP_LASER,
      's27',  // PRP
      's28',  // PRF
      's40',  // Drenaje linfático
      's41',  // Masaje reductor
      's44',  // Limpieza profunda
      's46',  // PDRN salmón
      's47',  // Exoglow
      's29',  // Sueroterapia
      's23',  // CO2 vaginal
      // Control de peso
      's14','s15','s16','s17',
      // Evaluaciones
      's52','s53',
    ],
    workDays:   [1,2,3,4,5,6],
    startHours: new Map([['1',11],['2',11],['3',11],['4',11],['5',11],['6',11]]),
    endHours:   new Map([['1',19],['2',19],['3',19],['4',19],['5',19],['6',19]]),
    scheduleDisplay: new Map([
      ['Lunes a Sábado', '11:00 am – 7:00 pm'],
    ]),
    availability: 'high',
  },

  // ── Esteticista 3 (Sofía González) ──────────────────────
  {
    specialistId: 'sp4',
    name:         'Esteticista 3',
    role:         'Estética Clínica',
    initials:     'E3',
    color:        '#5a6e9b',
    services: [
      ...DEP_LASER,
      's27',  // PRP
      's28',  // PRF
      's40',  // Drenaje linfático
      's41',  // Masaje reductor
      's43',  // Limpieza facial express
      's46',  // PDRN salmón
      's47',  // Exoglow
      's29',  // Sueroterapia
      // Control de peso
      's14','s15','s16','s17',
      // Evaluaciones
      's52','s53',
    ],
    workDays:   [1,2,3,4,5,6],
    startHours: new Map([['1',11],['2',11],['3',11],['4',11],['5',11],['6',11]]),
    endHours:   new Map([['1',19],['2',19],['3',19],['4',19],['5',19],['6',19]]),
    scheduleDisplay: new Map([
      ['Lunes a Sábado', '11:00 am – 7:00 pm'],
    ]),
    availability: 'high',
  },

  // ── Esteticista 4 (Hannia Hurtado) ──────────────────────
  // Solo sábados 11am–7pm
  {
    specialistId: 'sp5',
    name:         'Esteticista 4',
    role:         'Medicina Estética',
    initials:     'E4',
    color:        '#7a4a9b',
    services: [
      ...DEP_LASER,
      's27',  // PRP
      's28',  // PRF
      's40',  // Drenaje linfático
      's41',  // Masaje reductor
      's43',  // Limpieza facial express
      // Control de peso
      's14','s15','s16','s17',
      // Evaluaciones
      's52','s53',
    ],
    workDays:   [6],
    startHours: new Map([['6',11]]),
    endHours:   new Map([['6',19]]),
    scheduleDisplay: new Map([
      ['Sábado', '11:00 am – 7:00 pm'],
    ]),
    availability: 'sat',
  },
];

// ─────────────────────────────────────────────────────────────
//  SEED
// ─────────────────────────────────────────────────────────────
async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI no está definido en .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB');

    await Service.deleteMany({});
    await Specialist.deleteMany({});
    console.log('🗑️  Colecciones limpiadas');

    const svcs = await Service.insertMany(SERVICES);
    console.log(`✅ Servicios insertados: ${svcs.length}`);

    const specs = await Specialist.insertMany(SPECIALISTS);
    console.log(`✅ Especialistas insertadas: ${specs.length}`);

    console.log('\n🎉 Seed completado exitosamente');
    console.log('   Ejecuta: npm run dev');
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

seed();
