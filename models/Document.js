const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  empresa: {
    type: String,
    required: true,
    enum: ['x1', 'x2', 'x3']
  },
  tipo: {
    type: String,
    required: [true, 'El tipo de documento es obligatorio'],
    enum: [
      'cedula_identidad',
      'antecedentes',
      'contrato',
      'licencia_conducir',
      'examen_medico',
      'capacitacion',
      'seguro',
      'otro'
    ]
  },
  nombreArchivo: {
    type: String,
    required: true
  },
  rutaArchivo: {
    type: String,
    required: true
  },
  fechaVencimiento: {
    type: Date,
    required: [true, 'La fecha de vencimiento es obligatoria']
  },
  observaciones: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

documentSchema.index({ workerId: 1 });
documentSchema.index({ empresa: 1 });
documentSchema.index({ fechaVencimiento: 1 });

// Virtual: estado basado en fecha
documentSchema.virtual('estado').get(function () {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(this.fechaVencimiento);
  venc.setHours(0, 0, 0, 0);
  return venc >= hoy ? 'vigente' : 'vencido';
});

// Virtual: días restantes
documentSchema.virtual('diasRestantes').get(function () {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(this.fechaVencimiento);
  venc.setHours(0, 0, 0, 0);
  const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
  return diff;
});

documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

const TIPO_LABELS = {
  cedula_identidad: 'Cédula de Identidad',
  antecedentes: 'Antecedentes',
  contrato: 'Contrato',
  licencia_conducir: 'Licencia de Conducir',
  examen_medico: 'Examen Médico',
  capacitacion: 'Capacitación',
  seguro: 'Seguro',
  otro: 'Otro'
};

module.exports = mongoose.model('Document', documentSchema);
module.exports.TIPO_LABELS = TIPO_LABELS;
