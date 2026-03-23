const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId:       { type: String, required: true, unique: true }, // 's01', 's02', ...
  name:            { type: String, required: true },
  category:        { type: String, required: true },               // 'c1', 'c2', ...
  categoryName:    { type: String, required: true },
  categoryColor:   { type: String, required: true },               // '#9b4f6e'
  durationMinutes: { type: Number, required: true },               // 30, 60, 180...
  active:          { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
