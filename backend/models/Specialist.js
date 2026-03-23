const mongoose = require('mongoose');

const specialistSchema = new mongoose.Schema({
  specialistId: { type: String, required: true, unique: true }, // 'sp1', 'sp2', ...
  name:         { type: String, required: true },
  role:         { type: String, required: true },
  initials:     { type: String, required: true },               // 'YV', 'SM', ...
  color:        { type: String, required: true },               // '#9b4f6e'

  // IDs de servicios que ofrece este especialista
  services: [{ type: String }],

  // Días de la semana que trabaja: 0=Dom, 1=Lun, 2=Mar ... 6=Sáb
  workDays: [{ type: Number }],

  // Hora de entrada por día (formato decimal: 15.5 = 15:30)
  // Guardamos como Map porque las keys son números
  startHours: {
    type: Map,
    of: Number,
    default: {}
  },

  // Hora de salida por día (formato decimal)
  endHours: {
    type: Map,
    of: Number,
    default: {}
  },

  // Texto de horario para mostrar en la UI
  scheduleDisplay: {
    type: Map,
    of: String,
    default: {}
  },

  availability: {
    type: String,
    enum: ['high', 'med', 'sat', 'low'],
    default: 'high'
  },

  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Specialist', specialistSchema);
