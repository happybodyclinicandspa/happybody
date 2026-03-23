const express = require('express');
const router  = express.Router();
const Service = require('../models/Service');

// GET /api/services
// Devuelve todos los servicios activos, ordenados por categoría
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ active: true })
      .sort({ category: 1, name: 1 })
      .lean();

    res.json({ ok: true, data: services });
  } catch (err) {
    console.error('[GET /services]', err.message);
    res.status(500).json({ ok: false, error: 'Error al obtener servicios' });
  }
});

// GET /api/services/by-specialist/:specialistId
// Devuelve solo los servicios que ofrece un especialista específico
router.get('/by-specialist/:specialistId', async (req, res) => {
  try {
    const Specialist = require('../models/Specialist');
    const spec = await Specialist.findOne({
      specialistId: req.params.specialistId,
      active: true
    }).lean();

    if (!spec) {
      return res.status(404).json({ ok: false, error: 'Especialista no encontrado' });
    }

    const services = await Service.find({
      serviceId: { $in: spec.services },
      active: true
    }).lean();

    res.json({ ok: true, data: services });
  } catch (err) {
    console.error('[GET /services/by-specialist]', err.message);
    res.status(500).json({ ok: false, error: 'Error al obtener servicios' });
  }
});

module.exports = router;
