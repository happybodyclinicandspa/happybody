const express    = require('express');
const router     = express.Router();
const Specialist = require('../models/Specialist');

// GET /api/specialists
// Devuelve todos los especialistas activos
router.get('/', async (req, res) => {
  try {
    const specialists = await Specialist.find({ active: true })
      .sort({ name: 1 })
      .lean();

    // Convertir Maps de Mongoose a objetos planos para JSON
    const data = specialists.map(normalizeSpec);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('[GET /specialists]', err.message);
    res.status(500).json({ ok: false, error: 'Error al obtener especialistas' });
  }
});

// GET /api/specialists/:specialistId
router.get('/:specialistId', async (req, res) => {
  try {
    const spec = await Specialist.findOne({
      specialistId: req.params.specialistId,
      active: true
    }).lean();

    if (!spec) {
      return res.status(404).json({ ok: false, error: 'Especialista no encontrado' });
    }

    res.json({ ok: true, data: normalizeSpec(spec) });
  } catch (err) {
    console.error('[GET /specialists/:id]', err.message);
    res.status(500).json({ ok: false, error: 'Error al obtener especialista' });
  }
});

// Convierte Maps de Mongoose → objetos JS planos para que JSON.stringify los serialice bien
function normalizeSpec(spec) {
  return {
    ...spec,
    startHours:      isMap(spec.startHours) ? Object.fromEntries(spec.startHours) : spec.startHours,
    endHours:        isMap(spec.endHours) ? Object.fromEntries(spec.endHours) : spec.endHours,
    scheduleDisplay: isMap(spec.scheduleDisplay) ? Object.fromEntries(spec.scheduleDisplay) : spec.scheduleDisplay,
  };
}

// helper
function isMap(value) {
  return value instanceof Map;
}

module.exports = router;
