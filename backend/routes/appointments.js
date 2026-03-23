const express     = require('express');
const router      = express.Router();
const Appointment = require('../models/Appointment');
const Specialist  = require('../models/Specialist');

// ─────────────────────────────────────────────────────────────
//  UTILIDADES DE TIEMPO
// ─────────────────────────────────────────────────────────────

// "HH:MM" → minutos desde medianoche
function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Minutos desde medianoche → "HH:MM"
function fromMin(m) {
  const h  = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// Decimal (15.5) → "HH:MM" ("15:30")
function decimalToTime(dec) {
  const h  = Math.floor(dec);
  const m  = dec % 1 ? 30 : 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Genera array de slots cada 30 min entre startDecimal y endDecimal
// Ej: (11, 13) → ["11:00","11:30","12:00","12:30"]
function generateSlots(startDec, endDec) {
  const slots = [];
  let cur = startDec;
  while (cur < endDec) {
    slots.push(decimalToTime(cur));
    cur += 0.5;
  }
  return slots;
}

// ─────────────────────────────────────────────────────────────
//  GET /api/appointments/available
//  Query params:
//    specialistId     string   'sp1'
//    date             string   'YYYY-MM-DD'
//    serviceDuration  number   minutos (30, 60, 180...)
// ─────────────────────────────────────────────────────────────
router.get('/available', async (req, res) => {
  try {
    const { specialistId, date, serviceDuration } = req.query;

    // ── Validaciones básicas ──────────────────────────────
    if (!specialistId || !date || !serviceDuration) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan parámetros: specialistId, date, serviceDuration'
      });
    }

    const durMin = parseInt(serviceDuration, 10);
    if (isNaN(durMin) || durMin <= 0) {
      return res.status(400).json({ ok: false, error: 'serviceDuration debe ser un número positivo' });
    }

    // Validar formato de fecha YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ ok: false, error: 'date debe tener formato YYYY-MM-DD' });
    }

    // No permitir fechas pasadas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(date + 'T00:00:00');
    if (requestedDate < today) {
      return res.status(400).json({ ok: false, error: 'No se pueden consultar fechas pasadas' });
    }

    // ── Obtener especialista ──────────────────────────────
    const spec = await Specialist.findOne({ specialistId, active: true }).lean();
    if (!spec) {
      return res.status(404).json({ ok: false, error: 'Especialista no encontrado' });
    }

    // Día de la semana (0=Dom, 1=Lun ... 6=Sáb)
    const dow = requestedDate.getDay();

    // ¿Trabaja ese día?
    if (!spec.workDays.includes(dow)) {
      return res.json({
        ok: true,
        available: [],
        blocked: [],
        message: 'El especialista no trabaja ese día'
      });
    }

    // Hora de entrada/salida ese día
    // Mongoose Map → acceder con .get() o convertir a objeto
 const startHoursObj = spec.startHours || {};
const endHoursObj   = spec.endHours || {};

    const startDec = startHoursObj[dow];
    const endDec   = endHoursObj[dow];

    if (startDec === undefined || endDec === undefined) {
      return res.json({ ok: true, available: [], blocked: [], message: 'Sin horario configurado para ese día' });
    }

    // ── Generar todos los slots posibles ─────────────────
    const allSlots = generateSlots(startDec, endDec);
    const closeMin = endDec * 60; // minuto de cierre

    // ── Obtener citas existentes de ese especialista ese día ──
    const existingAppts = await Appointment.find({
      specialistId,
      date,
      status: { $ne: 'cancelled' }
    }).lean();

    // ── Algoritmo de bloqueo ──────────────────────────────
    //
    // Para cada slot candidato "T" (en minutos):
    //   1. La nueva cita ocuparía [T, T+durMin)
    //   2. Para cada cita existente con startTime=B y duration=D:
    //      La cita existente ocupa [B, B+D)
    //      Hay conflicto si: T < B+D  AND  T+durMin > B
    //      (los intervalos se solapan)
    //   3. También bloqueamos si T+durMin > closeMin (no cabe antes del cierre)
    //
    const available = [];
    const blocked   = [];

    for (const slot of allSlots) {
      const tMin    = toMin(slot);
      const tEndMin = tMin + durMin;

      // ¿La cita cabe antes del cierre?
      if (tEndMin > closeMin) {
        blocked.push(slot);
        continue;
      }

      // ¿Conflicto con alguna cita existente?
      let hasConflict = false;
      for (const appt of existingAppts) {
        const bStart = toMin(appt.startTime);
        const bEnd   = bStart + appt.durationMinutes;

        // Solapamiento: T < bEnd  AND  T+durMin > bStart
        if (tMin < bEnd && tEndMin > bStart) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict) {
        blocked.push(slot);
      } else {
        available.push(slot);
      }
    }

    // ── Respuesta ─────────────────────────────────────────
    res.json({
      ok: true,
      date,
      specialistId,
      serviceDurationMinutes: durMin,
      available,
      blocked,
      totalSlots:     allSlots.length,
      availableCount: available.length,
      bookedCount:    blocked.length
    });

  } catch (err) {
    console.error('[GET /appointments/available]', err.message);
    res.status(500).json({ ok: false, error: 'Error al calcular disponibilidad' });
  }
});

// ─────────────────────────────────────────────────────────────
//  POST /api/appointments
//  Crea una nueva cita (verifica que el slot siga libre)
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      patientName,
      patientPhone,
      specialistId,
      serviceId,
      serviceNames,
      date,
      startTime,
      durationMinutes
    } = req.body;

    // Validaciones
    if (!patientName || !specialistId || !serviceId || !date || !startTime || !durationMinutes) {
      return res.status(400).json({ ok: false, error: 'Faltan campos requeridos' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ ok: false, error: 'Formato de fecha inválido (YYYY-MM-DD)' });
    }
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      return res.status(400).json({ ok: false, error: 'Formato de hora inválido (HH:MM)' });
    }

    const durMin  = parseInt(durationMinutes, 10);
    const tMin    = toMin(startTime);
    const tEndMin = tMin + durMin;
    const endTime = fromMin(tEndMin);

    // ── Verificar que el slot sigue disponible (evitar race condition) ──
    const conflicts = await Appointment.find({
      specialistId,
      date,
      status: { $ne: 'cancelled' }
    }).lean();

    for (const appt of conflicts) {
      const bStart = toMin(appt.startTime);
      const bEnd   = bStart + appt.durationMinutes;
      if (tMin < bEnd && tEndMin > bStart) {
        return res.status(409).json({
          ok: false,
          error: 'Este horario ya fue ocupado. Por favor selecciona otro horario.'
        });
      }
    }

    // ── Crear la cita ─────────────────────────────────────
    const appointment = await Appointment.create({
      patientName:     patientName.trim(),
      patientPhone:    (patientPhone || '').trim(),
      specialistId,
      serviceId,
      serviceNames:    (serviceNames || '').trim(),
      date,
      startTime,
      endTime,
      durationMinutes: durMin,
      status:          'confirmed'
    });

    res.status(201).json({
      ok: true,
      message: '¡Cita confirmada exitosamente!',
      data: appointment
    });

  } catch (err) {
    console.error('[POST /appointments]', err.message);
    res.status(500).json({ ok: false, error: 'Error al crear la cita' });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/appointments
//  Lista citas (query params opcionales: date, specialistId)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.date)         filter.date         = req.query.date;
    if (req.query.specialistId) filter.specialistId = req.query.specialistId;
    if (req.query.status)       filter.status       = req.query.status;

    const appointments = await Appointment.find(filter)
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json({ ok: true, data: appointments, count: appointments.length });
  } catch (err) {
    console.error('[GET /appointments]', err.message);
    res.status(500).json({ ok: false, error: 'Error al obtener citas' });
  }
});

// ─────────────────────────────────────────────────────────────
//  PATCH /api/appointments/:id/cancel
// ─────────────────────────────────────────────────────────────
router.patch('/:id/cancel', async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!appt) return res.status(404).json({ ok: false, error: 'Cita no encontrada' });
    res.json({ ok: true, message: 'Cita cancelada', data: appt });
  } catch (err) {
    console.error('[PATCH /appointments/:id/cancel]', err.message);
    res.status(500).json({ ok: false, error: 'Error al cancelar la cita' });
  }
});

// ─────────────────────────────────────────────────────────────
//  PATCH /api/appointments/:id/complete
// ─────────────────────────────────────────────────────────────
router.patch('/:id/complete', async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    if (!appt) return res.status(404).json({ ok: false, error: 'Cita no encontrada' });
    res.json({ ok: true, message: 'Cita marcada como completada', data: appt });
  } catch (err) {
    console.error('[PATCH /appointments/:id/complete]', err.message);
    res.status(500).json({ ok: false, error: 'Error al completar la cita' });
  }
});

module.exports = router;
