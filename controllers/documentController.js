const Document = require('../models/Document');
const Worker = require('../models/Worker');
const path = require('path');
const fs = require('fs');

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

// GET documents for a worker
const getDocuments = async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.workerId, empresa: req.empresa });
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado.' });

    const documents = await Document.find({ workerId: worker._id }).sort({ fechaVencimiento: 1 });
    res.json({ success: true, data: documents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener documentos.' });
  }
};

// POST upload document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    const { workerId, tipo, fechaVencimiento, observaciones } = req.body;

    const worker = await Worker.findOne({ _id: workerId, empresa: req.empresa });
    if (!worker) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Trabajador no encontrado.' });
    }

    if (!tipo || !fechaVencimiento) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Tipo y fecha de vencimiento son obligatorios.' });
    }

    const doc = new Document({
      workerId: worker._id,
      empresa: req.empresa,
      tipo,
      nombreArchivo: req.file.originalname,
      rutaArchivo: req.file.path,
      fechaVencimiento: new Date(fechaVencimiento),
      observaciones: observaciones || ''
    });

    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Error al subir documento.' });
  }
};

// DELETE document
const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, empresa: req.empresa });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });

    // Delete file from disk
    if (fs.existsSync(doc.rutaArchivo)) {
      fs.unlinkSync(doc.rutaArchivo);
    }

    await doc.deleteOne();
    res.json({ success: true, message: 'Documento eliminado.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar documento.' });
  }
};

// Serve document file
const serveDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, empresa: req.empresa });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });

    if (!fs.existsSync(doc.rutaArchivo)) {
      return res.status(404).json({ error: 'Archivo no encontrado en servidor.' });
    }

    res.sendFile(path.resolve(doc.rutaArchivo));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al servir documento.' });
  }
};

module.exports = { getDocuments, uploadDocument, deleteDocument, serveDocument, TIPO_LABELS };
