const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Datos del paciente
  patientName:  { type: String, required: true, trim: true },
  patientPhone: { type: String, trim: true, default: '' },

  // Referencias al especialista y servicio
  specialistId: { type: String, required: true }, // 'sp1', 'sp2', ...
  serviceId:    { type: String, required: true }, // ID(s) del servicio, puede ser 's01' o 's01,s02' para múltiples
  serviceNames:  { type: String, default: '' },       // Nombres legibles de los servicios

  // Fecha de la cita (solo fecha, sin hora — se guarda como YYYY-MM-DD string
  // para evitar problemas de timezone en consultas)
  date:      { type: String, required: true }, // '2026-03-21'

  // Hora de inicio y fin en formato "HH:MM"
  startTime: { type: String, required: true }, // '15:30'
  endTime:   { type: String, required: true }, // '16:30'

  // Duración en minutos (copia del servicio al momento de agendar)
  durationMinutes: { type: Number, required: true },

  // Estado de la cita
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  }
}, {
  timestamps: true // createdAt, updatedAt automáticos
});

// Índice compuesto para acelerar las consultas de disponibilidad
// La consulta más frecuente es: "citas de este especialista en esta fecha"
appointmentSchema.index({ specialistId: 1, date: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
