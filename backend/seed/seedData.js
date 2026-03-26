require('dotenv').config();
const mongoose   = require('mongoose');
const Service    = require('../models/Service');
const Specialist = require('../models/Specialist');

// ─────────────────────────────────────────────────────────────
//  SERVICIOS — fuente: Servicios.pdf
//  IDs de especialistas:
//    sp1 = Dra. Yesica Valdés
//    sp2 = Esteticista 1  (HappyBody 1)
//    sp3 = Esteticista 2  (HappyBody 2)
//    sp4 = Esteticista 3  (HappyBody 3)
//    sp5 = Esteticista 4  (HappyBody 4)
//
//  Conversión de duración del PDF:
//    "30 min"       → 30
//    "1 hrs"        → 60
//    "1 hrs 30 min" → 90
//    "2 hrs"        → 120
//    "4 hrs 10 min" → 250   (lapicera consecutivo — valor del PDF)
//    sin duración   → 60   (default)
// ─────────────────────────────────────────────────────────────

const SERVICES = [

  // ── BIOESTIMULADORES ──────────────────────────────────────
  { serviceId:'s01', name:'Lipofilling facial nanofat',           category:'c01', categoryName:'Bioestimuladores',            categoryColor:'#5a6e9b', durationMinutes:90  },
  { serviceId:'s02', name:'Lipofilling microfat',                 category:'c01', categoryName:'Bioestimuladores',            categoryColor:'#5a6e9b', durationMinutes:60  },
  { serviceId:'s03', name:'Radiesse – Hidroxiapatita de Calcio',  category:'c01', categoryName:'Bioestimuladores',            categoryColor:'#5a6e9b', durationMinutes:30  },
  { serviceId:'s04', name:'Sculptra',                             category:'c01', categoryName:'Bioestimuladores',            categoryColor:'#5a6e9b', durationMinutes:30  },

  // ── CONTROL METABÓLICO ─────────────────────────────────────
  { serviceId:'s05', name:'Control de peso homeopático consecutivo', category:'c02', categoryName:'Control Metabólico',       categoryColor:'#b8894a', durationMinutes:30  },
  { serviceId:'s06', name:'Lapicera 0.25–0.50 mg consecutivo',    category:'c02', categoryName:'Control Metabólico',          categoryColor:'#b8894a', durationMinutes:250 },
  { serviceId:'s07', name:'Lapicera 0.25–0.50 mg Nuevo',          category:'c02', categoryName:'Control Metabólico',          categoryColor:'#b8894a', durationMinutes:60  },
  { serviceId:'s08', name:'Lapicera 1 mg Nuevo',                  category:'c02', categoryName:'Control Metabólico',          categoryColor:'#b8894a', durationMinutes:60  },
  { serviceId:'s09', name:'Lapicera 1 mg consecutivo',            category:'c02', categoryName:'Control Metabólico',          categoryColor:'#b8894a', durationMinutes:30  },

  // ── DEPILACIÓN LÁSER ──────────────────────────────────────
  { serviceId:'s10', name:'Depilación láser – Barba',             category:'c03', categoryName:'Depilación Láser',            categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s11', name:'Depilación láser – Bikini',            category:'c03', categoryName:'Depilación Láser',            categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s12', name:'Depilación láser – Bozo',              category:'c03', categoryName:'Depilación Láser',            categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s13', name:'Depilación láser – Brazos',            category:'c03', categoryName:'Depilación Láser',            categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s14', name:'Depilación láser – Full face',         category:'c03', categoryName:'Depilación Láser',            categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s15', name:'Depilación láser – Espalda',           category:'c03', categoryName:'Depilación Láser',            categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s16', name:'Depilación láser – Full body',         category:'c03', categoryName:'Depilación Láser',            categoryColor:'#7a4a9b', durationMinutes:60  },
  { serviceId:'s17', name:'Depilación láser – Full íntimo',       category:'c03', categoryName:'Depilación Láser',            categoryColor:'#7a4a9b', durationMinutes:30  },
  { serviceId:'s18', name:'Depilación láser – Piernas completas', category:'c03', categoryName:'Depilación Láser',            categoryColor:'#7a4a9b', durationMinutes:60  },

  // ── ELECTROCAUTERIZACIÓN ──────────────────────────────────
  { serviceId:'s19', name:'Electrocauterización – Acrocordones',  category:'c04', categoryName:'Electrocauterización',        categoryColor:'#6a6a6a', durationMinutes:30  },
  { serviceId:'s20', name:'Electrocauterización – Lunares pequeños', category:'c04', categoryName:'Electrocauterización',     categoryColor:'#6a6a6a', durationMinutes:30  },
  { serviceId:'s21', name:'Electrocauterización – Milium',        category:'c04', categoryName:'Electrocauterización',        categoryColor:'#6a6a6a', durationMinutes:30  },
  { serviceId:'s22', name:'Electrocauterización – Queratosis seborreica', category:'c04', categoryName:'Electrocauterización', categoryColor:'#6a6a6a', durationMinutes:30 },
  { serviceId:'s23', name:'Electrocauterización – Verrugas planas', category:'c04', categoryName:'Electrocauterización',      categoryColor:'#6a6a6a', durationMinutes:30  },

  // ── ESTÉTICA CAPILAR ──────────────────────────────────────
  { serviceId:'s24', name:'Capilar – Mesoterapia',                category:'c05', categoryName:'Estética Capilar',            categoryColor:'#4a8a5a', durationMinutes:30  },
  { serviceId:'s25', name:'Capilar – PRP plasma rico en plaquetas', category:'c05', categoryName:'Estética Capilar',          categoryColor:'#4a8a5a', durationMinutes:30  },

  // ── ESTÉTICA CORPORAL ─────────────────────────────────────
  { serviceId:'s26', name:'Drenaje linfático',                    category:'c06', categoryName:'Estética Corporal',           categoryColor:'#4a7a6e', durationMinutes:30  },
  { serviceId:'s27', name:'Liposonix',                            category:'c06', categoryName:'Estética Corporal',           categoryColor:'#4a7a6e', durationMinutes:30  },
  { serviceId:'s28', name:'Masaje reductor',                      category:'c06', categoryName:'Estética Corporal',           categoryColor:'#4a7a6e', durationMinutes:30  },
  { serviceId:'s29', name:'Subcisión celulitis',                  category:'c06', categoryName:'Estética Corporal',           categoryColor:'#4a7a6e', durationMinutes:30  },

  // ── ESTÉTICA FACIAL ───────────────────────────────────────
  { serviceId:'s30', name:'Hilos tensores PDO',                   category:'c07', categoryName:'Estética Facial',             categoryColor:'#c0394a', durationMinutes:30  },
  { serviceId:'s31', name:'Microdermoabrasión',                   category:'c07', categoryName:'Estética Facial',             categoryColor:'#c0394a', durationMinutes:30  },
  { serviceId:'s32', name:'Nanopore arrugas',                     category:'c07', categoryName:'Estética Facial',             categoryColor:'#c0394a', durationMinutes:30  },
  { serviceId:'s33', name:'Peeling enzimático',                   category:'c07', categoryName:'Estética Facial',             categoryColor:'#c0394a', durationMinutes:30  },
  { serviceId:'s34', name:'Peeling químico',                      category:'c07', categoryName:'Estética Facial',             categoryColor:'#c0394a', durationMinutes:30  },
  { serviceId:'s35', name:'PRF – Plasma Rico en Fibrina',         category:'c07', categoryName:'Estética Facial',             categoryColor:'#c0394a', durationMinutes:30  },
  { serviceId:'s36', name:'PRP – Plasma Rico en Plaquetas',       category:'c07', categoryName:'Estética Facial',             categoryColor:'#c0394a', durationMinutes:30  },
  { serviceId:'s37', name:'Subcisión acné',                       category:'c07', categoryName:'Estética Facial',             categoryColor:'#c0394a', durationMinutes:30  },

  // ── FACIAL ────────────────────────────────────────────────
  { serviceId:'s38', name:'Limpieza facial profunda',             category:'c08', categoryName:'Facial',                      categoryColor:'#8a6a4a', durationMinutes:60  },
  { serviceId:'s39', name:'Limpieza facial express',              category:'c08', categoryName:'Facial',                      categoryColor:'#8a6a4a', durationMinutes:30  },
  { serviceId:'s40', name:'Paquete Glow Skin (pacientes jóvenes)',category:'c08', categoryName:'Facial',                      categoryColor:'#8a6a4a', durationMinutes:60  },

  // ── LÁSER CO2 ─────────────────────────────────────────────
  { serviceId:'s41', name:'Láser CO2 – Cicatrices',               category:'c09', categoryName:'Láser CO2',                   categoryColor:'#3a6a8a', durationMinutes:30  },
  { serviceId:'s42', name:'Láser CO2 – Estrías',                  category:'c09', categoryName:'Láser CO2',                   categoryColor:'#3a6a8a', durationMinutes:30  },
  { serviceId:'s43', name:'Láser CO2 – Rejuvenecimiento facial',  category:'c09', categoryName:'Láser CO2',                   categoryColor:'#3a6a8a', durationMinutes:30  },
  { serviceId:'s44', name:'Láser CO2 – Poros rostro',             category:'c09', categoryName:'Láser CO2',                   categoryColor:'#3a6a8a', durationMinutes:30  },
  { serviceId:'s45', name:'Láser CO2 – Rejuvenecimiento vaginal', category:'c09', categoryName:'Láser CO2',                   categoryColor:'#3a6a8a', durationMinutes:30  },

  // ── LIPÓLISIS LÁSER ───────────────────────────────────────
  { serviceId:'s46', name:'Blefaroplastia láser superior',        category:'c10', categoryName:'Lipólisis Láser',             categoryColor:'#a04030', durationMinutes:60  },
  { serviceId:'s47', name:'Lipopapada láser',                     category:'c10', categoryName:'Lipólisis Láser',             categoryColor:'#a04030', durationMinutes:60  },

  // ── OTROS ─────────────────────────────────────────────────
  { serviceId:'s48', name:'Láser melasma',                        category:'c11', categoryName:'Otros',                       categoryColor:'#7a3555', durationMinutes:30  },

  // ── PAQUETES HAPPY BODY ───────────────────────────────────
  { serviceId:'s49', name:'Paquete Anti Edad',                    category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:60  },
  { serviceId:'s50', name:'Armonización Facial Completa',         category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:90  },
  { serviceId:'s51', name:'Control de peso homeopático (paquete)',category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:30  },
  { serviceId:'s52', name:'CORPORAL Reducción localizada',        category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:60  },
  { serviceId:'s53', name:'Facial – Regeneración celular y efecto glow', category:'c12', categoryName:'Paquetes Happy Body', categoryColor:'#9b4f6e', durationMinutes:60  },
  { serviceId:'s54', name:'Facial Regenerativo Premium',          category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:60  },
  { serviceId:'s55', name:'Fortalecimiento capilar',              category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:60  },
  { serviceId:'s56', name:'Glow Facial',                          category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:90  },
  { serviceId:'s57', name:'Happy Skin',                           category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:90  },
  { serviceId:'s58', name:'Paquete Anti Edad VIP',                category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:120 },
  { serviceId:'s59', name:'Paquete Bioestimulación Premium',      category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:90  },
  { serviceId:'s60', name:'Paquete Control de peso + estética corporal', category:'c12', categoryName:'Paquetes Happy Body',  categoryColor:'#9b4f6e', durationMinutes:90  },
  { serviceId:'s61', name:'Rejuvenecimiento Premium',             category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:60  },
  { serviceId:'s62', name:'Rejuvenecimiento VIP',                 category:'c12', categoryName:'Paquetes Happy Body',         categoryColor:'#9b4f6e', durationMinutes:90  },

  // ── REJUVENECIMIENTO FACIAL COMPLETO ──────────────────────
  { serviceId:'s63', name:'Paquete Rejuvenecimiento Facial Completo (cara+cuello)', category:'c13', categoryName:'Rejuvenecimiento Facial Completo', categoryColor:'#7a5a3a', durationMinutes:90 },
  { serviceId:'s64', name:'Rejuvenece integral',                  category:'c13', categoryName:'Rejuvenecimiento Facial Completo', categoryColor:'#7a5a3a', durationMinutes:60 },

  // ── REJUVENECIMIENTO FACIAL PREMIUM ──────────────────────
  { serviceId:'s65', name:'Armonización Facial Premium',          category:'c14', categoryName:'Rejuvenecimiento Facial Premium', categoryColor:'#6a4a6a', durationMinutes:90 },
  { serviceId:'s66', name:'Paquete Botox + Ácido Hialurónico',    category:'c14', categoryName:'Rejuvenecimiento Facial Premium', categoryColor:'#6a4a6a', durationMinutes:60 },
  { serviceId:'s67', name:'Paquete Premium Botox full face + 1 jeringa HA', category:'c14', categoryName:'Rejuvenecimiento Facial Premium', categoryColor:'#6a4a6a', durationMinutes:60 },
  { serviceId:'s68', name:'Paquete VIP Botox Full Face + 2 jeringas HA', category:'c14', categoryName:'Rejuvenecimiento Facial Premium', categoryColor:'#6a4a6a', durationMinutes:60 },

  // ── RELLENO DE ÁCIDO HIALURÓNICO ─────────────────────────
  { serviceId:'s69', name:'Relleno de labios – 2 jeringas',       category:'c15', categoryName:'Relleno de Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:30 },
  { serviceId:'s70', name:'Relleno de labios HA – 1 jeringa',     category:'c15', categoryName:'Relleno de Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:30 },
  { serviceId:'s71', name:'Relleno mixto labios y surcos',        category:'c15', categoryName:'Relleno de Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:60 },
  { serviceId:'s72', name:'Relleno región temporal – 2 jeringas', category:'c15', categoryName:'Relleno de Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:30 },
  { serviceId:'s73', name:'Relleno surcos nasogenianos – 1 jeringa', category:'c15', categoryName:'Relleno de Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:30 },
  { serviceId:'s74', name:'Relleno surcos nasogenianos – 2 jeringas', category:'c15', categoryName:'Relleno de Ácido Hialurónico', categoryColor:'#9b4f6e', durationMinutes:60 },

  // ── SUEROTERAPIA ──────────────────────────────────────────
  { serviceId:'s75', name:'Endoláser venoso',                     category:'c16', categoryName:'Sueroterapia',                categoryColor:'#2a6a7a', durationMinutes:30  },
  { serviceId:'s76', name:'Suero glutatión + selenio',            category:'c16', categoryName:'Sueroterapia',                categoryColor:'#2a6a7a', durationMinutes:30  },
  { serviceId:'s77', name:'Sueroterapia NAD',                     category:'c16', categoryName:'Sueroterapia',                categoryColor:'#2a6a7a', durationMinutes:30  },
  { serviceId:'s78', name:'Sueroterapia vitamina C',              category:'c16', categoryName:'Sueroterapia',                categoryColor:'#2a6a7a', durationMinutes:30  },

  // ── TOXINA BOTULÍNICA ─────────────────────────────────────
  { serviceId:'s79', name:'Toxina Botulínica – Paquete Básico',   category:'c17', categoryName:'Toxina Botulínica',           categoryColor:'#7a3555', durationMinutes:30  },
  { serviceId:'s80', name:'Toxina Botulínica – Paquete Premium full face', category:'c17', categoryName:'Toxina Botulínica',  categoryColor:'#7a3555', durationMinutes:30  },
  { serviceId:'s81', name:'Toxina Botulínica – Paquete VIP full face+cuello', category:'c17', categoryName:'Toxina Botulínica', categoryColor:'#7a3555', durationMinutes:60 },
  { serviceId:'s82', name:'Toxina Botulínica – Cuello Nefertiti', category:'c17', categoryName:'Toxina Botulínica',           categoryColor:'#7a3555', durationMinutes:30  },

  // ── TRATAMIENTO FACIAL REGENERATIVO ──────────────────────
  { serviceId:'s83', name:'Faciales Avanzados EXOGLOW exosoma',   category:'c18', categoryName:'Tratamiento Facial Regenerativo', categoryColor:'#6a4a8a', durationMinutes:30 },
  { serviceId:'s84', name:'Faciales Avanzados PDRN (salmón)',     category:'c18', categoryName:'Tratamiento Facial Regenerativo', categoryColor:'#6a4a8a', durationMinutes:30 },
  { serviceId:'s85', name:'Paquete Rejuvenecimiento Facial Completo (regenerativo)', category:'c18', categoryName:'Tratamiento Facial Regenerativo', categoryColor:'#6a4a8a', durationMinutes:90 },
  { serviceId:'s86', name:'Tratamiento Facial',                   category:'c18', categoryName:'Tratamiento Facial Regenerativo', categoryColor:'#6a4a8a', durationMinutes:30 },
];

// ─────────────────────────────────────────────────────────────
//  HELPERS — grupos de IDs por especialista
// ─────────────────────────────────────────────────────────────

// sp1 = Dra. Yesica
const SP1 = [
  's01','s02','s03','s04',                          // Bioestimuladores
  's07','s08',                                       // Control metabólico (solo Nuevo)
  's21',                                             // Electrocauterización Milium
  's25',                                             // Capilar PRP
  's29',                                             // Subcisión celulitis
  's30','s34','s37',                                 // Estética facial: Hilos PDO, Peeling Qco, Subcisión acné
  's43','s45',                                       // Láser CO2: rejuv facial, vaginal
  's46','s47',                                       // Lipólisis láser
  's48',                                             // Otros: láser melasma
  's49','s50','s52','s58','s59','s60','s61','s62',   // Paquetes Yesica
  's63','s64',                                       // Rejuv facial completo
  's65','s66','s67','s68',                           // Rejuv facial premium
  's69','s70','s71','s72','s73','s74',               // Rellenos AH
  's79','s80','s81','s82',                           // Toxina botulínica
  's85',                                             // Trat. facial regen. (paquete)
];

// sp2 = Esteticista 1 (HappyBody 1)
const SP2 = [
  's05','s06','s09',                                 // Control metabólico (sin Nuevo)
  's10','s11','s12','s13','s14','s15','s16','s17','s18', // Depilación láser
  's19','s20','s22','s23',                           // Electrocauterización (sin Milium)
  's24','s25',                                       // Capilar
  's26','s27','s28','s29',                           // Corporal
  's31','s32','s33','s35','s36',                     // Estética facial (sin Hilos PDO, sin Peeling Qco)
  's38','s39','s40',                                 // Facial
  's41','s42','s43','s44','s45',                     // Láser CO2
  's51','s53','s54','s55','s56','s57','s60',         // Paquetes E1
  's75','s76','s77','s78',                           // Sueroterapia
  's83','s84',                                       // Tratamiento facial regen.
];

// sp3 = Esteticista 2 (HappyBody 2)
const SP3 = [
  's05','s06','s09',
  's10','s11','s12','s13','s14','s15','s16','s17','s18',
  's19','s20','s21','s22','s23',                     // Electrocauterización (incluyendo Milium)
  's24','s25',
  's26','s27','s28','s29',
  's31','s32','s33','s34','s35','s36',               // Estética facial (incluye Peeling Qco)
  's38','s39','s40',
  's41','s42','s43','s44','s45',
  's51','s53','s54','s55','s56','s57','s60',
  's75','s76','s77','s78',
  's83','s84','s86',                                 // Tratamiento facial regen. (incluye Tratamiento Facial)
];

// sp4 = Esteticista 3 (HappyBody 3)
const SP4 = [
  's05','s06','s09',
  's10','s11','s12','s13','s14','s15','s16','s17','s18',
  's19','s20','s21','s22','s23',
  's24','s25',
  's26','s27','s28','s29',
  's31','s32','s33','s35','s36',                     // Estética facial (sin Peeling Qco)
  's38','s39','s40',
  's41','s42','s43','s44','s45',
  's51','s55','s56','s57','s60',                     // Paquetes E3
  's75','s76','s77','s78',
];

// sp5 = Esteticista 4 (HappyBody 4)
const SP5 = [
  's10','s11','s12','s13','s14','s15','s16','s17','s18',
  's19','s20','s22','s23',                           // Electrocauterización (sin Milium)
  's24','s25',
  's26','s27','s28','s29',
  's31','s32','s33','s35','s36',                     // Estética facial (sin Hilos PDO, sin Peeling Qco)
  's38','s39','s40',
  's41','s42','s43','s44','s45',
  's51','s55','s56','s57',                           // Paquetes E4
  's75','s76','s77','s78',
];

// ─────────────────────────────────────────────────────────────
//  ESPECIALISTAS
//  Cambio horario Dra. Yesica: Martes–Viernes 3:30pm–7:00pm
//  workDays: 2=Mar 3=Mié 4=Jue 5=Vie
// ─────────────────────────────────────────────────────────────
const SPECIALISTS = [
  {
    specialistId: 'sp1',
    name:         'Dra. Yesica Valdés',
    role:         'Medicina Estética · Directora',
    initials:     'DY',
    color:        '#9b4f6e',
    services:     SP1,
    workDays:     [2,3,4,5],
    startHours:   new Map([['2',15.5],['3',15.5],['4',15.5],['5',15.5]]),
    endHours:     new Map([['2',19],  ['3',19],  ['4',19],  ['5',19]]),
    scheduleDisplay: new Map([
      ['Martes a Viernes', '3:30 – 7:00 pm'],
    ]),
    availability: 'high',
  },
  {
    specialistId: 'sp2',
    name:         'Esteticista 1',
    role:         'Estética Integral',
    initials:     'E1',
    color:        '#c0394a',
    services:     SP2,
    workDays:     [1,2,5,6],
    startHours:   new Map([['1',11],['2',11],['5',11],['6',15.5]]),
    endHours:     new Map([['1',19],['2',19],['5',19],['6',19]]),
    scheduleDisplay: new Map([
      ['Lun, Mar & Vie', '11:00 am – 7:00 pm'],
      ['Sábado',         '3:30 – 7:00 pm'],
    ]),
    availability: 'high',
  },
  {
    specialistId: 'sp3',
    name:         'Esteticista 2',
    role:         'Estética Clínica',
    initials:     'E2',
    color:        '#4a7a6e',
    services:     SP3,
    workDays:     [1,2,3,4,5,6],
    startHours:   new Map([['1',11],['2',11],['3',11],['4',11],['5',11],['6',11]]),
    endHours:     new Map([['1',19],['2',19],['3',19],['4',19],['5',19],['6',19]]),
    scheduleDisplay: new Map([
      ['Lunes a Sábado', '11:00 am – 7:00 pm'],
    ]),
    availability: 'high',
  },
  {
    specialistId: 'sp4',
    name:         'Esteticista 3',
    role:         'Estética Clínica',
    initials:     'E3',
    color:        '#5a6e9b',
    services:     SP4,
    workDays:     [1,2,3,4,5,6],
    startHours:   new Map([['1',11],['2',11],['3',11],['4',11],['5',11],['6',11]]),
    endHours:     new Map([['1',19],['2',19],['3',19],['4',19],['5',19],['6',19]]),
    scheduleDisplay: new Map([
      ['Lunes a Sábado', '11:00 am – 7:00 pm'],
    ]),
    availability: 'high',
  },
  {
    specialistId: 'sp5',
    name:         'Esteticista 4',
    role:         'Medicina Estética',
    initials:     'E4',
    color:        '#7a4a9b',
    services:     SP5,
    workDays:     [6],
    startHours:   new Map([['6',11]]),
    endHours:     new Map([['6',19]]),
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
  if (!uri) { console.error('❌ MONGODB_URI no definido'); process.exit(1); }
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB');
    await Service.deleteMany({});
    await Specialist.deleteMany({});
    console.log('🗑️  Colecciones limpiadas');
    const svcs  = await Service.insertMany(SERVICES);
    console.log(`✅ Servicios insertados: ${svcs.length}`);
    const specs = await Specialist.insertMany(SPECIALISTS);
    console.log(`✅ Especialistas insertadas: ${specs.length}`);
    console.log('\n🎉 Seed completado');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  }
}

module.exports = seed;
