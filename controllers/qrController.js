const QRCode = require('qrcode');
const Worker = require('../models/Worker');
const { COMPANIES } = require('../config/auth');

// Generate QR data URL for a worker (authenticated)
const getWorkerQR = async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, empresa: req.empresa });
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado.' });

    // Ensure token exists
    if (!worker.qrToken) {
      const crypto = require('crypto');
      worker.qrToken = crypto.randomBytes(24).toString('hex');
      await worker.save();
    }

    const verifyUrl = `${req.protocol}://${req.get('host')}/qr/${worker.qrToken}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: { dark: '#0f172a', light: '#ffffff' }
    });

    res.json({
      success: true,
      data: {
        qrDataUrl,
        verifyUrl,
        workerName: worker.nombre,
        qrToken: worker.qrToken
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al generar QR.' });
  }
};

// PUBLIC: Verify QR token — no auth required
const verifyQR = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || !/^[a-f0-9]{48}$/.test(token)) {
      return res.status(400).json({ error: 'Token inválido.' });
    }

    const worker = await Worker.findOne({ qrToken: token });
    if (!worker) {
      return res.json({
        valid: false,
        status: 'ACCESO DENEGADO',
        reason: 'Trabajador no encontrado o QR no válido.'
      });
    }

    const company = COMPANIES[worker.empresa];
    res.json({
      valid: true,
      activo: worker.activo,
      status: worker.activo ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO',
      data: {
        nombre: worker.nombre,
        cargo: worker.cargo,
        empresa: company ? company.name : worker.empresa,
        activo: worker.activo
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al verificar QR.' });
  }
};

module.exports = { getWorkerQR, verifyQR };
