const Worker = require('../models/Worker');
const Document = require('../models/Document');

// GET all workers for company
const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find({ empresa: req.empresa, activo: true }).sort({ createdAt: -1 });

    // For each worker, get document stats
    const workersWithStats = await Promise.all(workers.map(async (w) => {
      const docs = await Document.find({ workerId: w._id });
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const vencidos = docs.filter(d => new Date(d.fechaVencimiento) < hoy).length;
      return {
        ...w.toObject(),
        totalDocumentos: docs.length,
        documentosVencidos: vencidos,
        estadoGeneral: vencidos > 0 ? 'vencido' : 'vigente'
      };
    }));

    res.json({ success: true, data: workersWithStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener trabajadores.' });
  }
};

// GET single worker with documents
const getWorker = async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, empresa: req.empresa });
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado.' });

    const documents = await Document.find({ workerId: worker._id }).sort({ fechaVencimiento: 1 });

    res.json({ success: true, data: { worker, documents } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener trabajador.' });
  }
};

// POST create worker
const createWorker = async (req, res) => {
  try {
    const { nombre, rut, cargo } = req.body;

    if (!nombre || !rut || !cargo) {
      return res.status(400).json({ error: 'Nombre, RUT y cargo son obligatorios.' });
    }

    // Check RUT duplicate in same company
    const existing = await Worker.findOne({ rut: rut.trim(), empresa: req.empresa });
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un trabajador con ese RUT en esta empresa.' });
    }

    const worker = new Worker({
      nombre: nombre.trim(),
      rut: rut.trim(),
      cargo: cargo.trim(),
      empresa: req.empresa
    });

    await worker.save();
    res.status(201).json({ success: true, data: worker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear trabajador.' });
  }
};

// PUT update worker
const updateWorker = async (req, res) => {
  try {
    const { nombre, rut, cargo } = req.body;
    const worker = await Worker.findOne({ _id: req.params.id, empresa: req.empresa });
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado.' });

    if (nombre) worker.nombre = nombre.trim();
    if (rut) worker.rut = rut.trim();
    if (cargo) worker.cargo = cargo.trim();

    await worker.save();
    res.json({ success: true, data: worker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar trabajador.' });
  }
};

// DELETE worker (soft delete)
const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, empresa: req.empresa });
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado.' });

    worker.activo = false;
    await worker.save();

    // Also delete their documents
    await Document.deleteMany({ workerId: worker._id });

    res.json({ success: true, message: 'Trabajador eliminado.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar trabajador.' });
  }
};

module.exports = { getWorkers, getWorker, createWorker, updateWorker, deleteWorker };
