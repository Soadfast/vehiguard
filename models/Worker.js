const mongoose = require('mongoose');
const crypto = require('crypto');

const workerSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  rut: {
    type: String,
    required: [true, 'El RUT es obligatorio'],
    trim: true
  },
  cargo: {
    type: String,
    required: [true, 'El cargo es obligatorio'],
    trim: true
  },
  empresa: {
    type: String,
    required: true,
    enum: ['x1', 'x2', 'x3']
  },
  activo: {
    type: Boolean,
    default: true
  },
  // QR unique token — generated on creation, never changes
  qrToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Auto-generate QR token before saving if missing
workerSchema.pre('save', function(next) {
  if (!this.qrToken) {
    this.qrToken = crypto.randomBytes(24).toString('hex');
  }
  next();
});

workerSchema.index({ empresa: 1 });
workerSchema.index({ rut: 1, empresa: 1 }, { unique: true });
workerSchema.index({ qrToken: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Worker', workerSchema);
