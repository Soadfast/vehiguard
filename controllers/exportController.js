const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Worker = require('../models/Worker');
const Document = require('../models/Document');
const { COMPANIES } = require('../config/auth');

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

const getEstado = (fechaVencimiento) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento);
  venc.setHours(0, 0, 0, 0);
  return venc >= hoy ? 'VIGENTE' : 'VENCIDO';
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

// Export to Excel
const exportExcel = async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, empresa: req.empresa });
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado.' });

    const documents = await Document.find({ workerId: worker._id }).sort({ fechaVencimiento: 1 });
    const company = COMPANIES[req.empresa];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MIDDI Sistema';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Información Trabajador', {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    // Header styles
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1117' } };
    const sectionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF161B22' } };
    const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00C853' } };
    const redFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD50000' } };
    const whiteFont = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11, name: 'Calibri' };
    const normalFont = { size: 10, name: 'Calibri' };

    sheet.columns = [
      { width: 25 }, { width: 35 }, { width: 20 }, { width: 15 }, { width: 15 }
    ];

    // Title row
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `MIDDI - Sistema de Gestión Documental`;
    titleCell.font = { ...whiteFont, size: 16, bold: true };
    titleCell.fill = headerFill;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    // Company row
    sheet.mergeCells('A2:E2');
    const companyCell = sheet.getCell('A2');
    companyCell.value = company.name;
    companyCell.font = { ...whiteFont, size: 12 };
    companyCell.fill = sectionFill;
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 28;

    // Export date
    sheet.mergeCells('A3:E3');
    const dateCell = sheet.getCell('A3');
    dateCell.value = `Exportado: ${formatDate(new Date())}`;
    dateCell.font = { ...normalFont, italic: true, color: { argb: 'FF888888' } };
    dateCell.fill = sectionFill;
    dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
    sheet.getRow(3).height = 20;

    // Empty row
    sheet.addRow([]);

    // Worker info section
    sheet.mergeCells('A5:E5');
    const workerHeader = sheet.getCell('A5');
    workerHeader.value = 'DATOS DEL TRABAJADOR';
    workerHeader.font = { ...whiteFont, size: 12 };
    workerHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    workerHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(5).height = 25;

    const workerData = [
      ['Nombre', worker.nombre],
      ['RUT', worker.rut],
      ['Cargo', worker.cargo],
      ['Empresa', company.name],
      ['Fecha de Registro', formatDate(worker.createdAt)]
    ];

    workerData.forEach(([label, value]) => {
      const row = sheet.addRow([label, value]);
      row.getCell(1).font = { ...normalFont, bold: true };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C2128' } };
      row.getCell(2).font = normalFont;
      row.height = 20;
    });

    sheet.addRow([]);

    // Documents section
    const docsHeaderRow = sheet.addRow(['TIPO DOCUMENTO', 'NOMBRE ARCHIVO', 'FECHA SUBIDA', 'VENCIMIENTO', 'ESTADO']);
    docsHeaderRow.eachCell((cell) => {
      cell.font = whiteFont;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1117' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF333333' } }
      };
    });
    docsHeaderRow.height = 25;

    if (documents.length === 0) {
      const emptyRow = sheet.addRow(['Sin documentos registrados', '', '', '', '']);
      sheet.mergeCells(`A${emptyRow.number}:E${emptyRow.number}`);
      emptyRow.getCell(1).alignment = { horizontal: 'center' };
      emptyRow.getCell(1).font = { ...normalFont, italic: true, color: { argb: 'FF888888' } };
    } else {
      documents.forEach((doc) => {
        const estado = getEstado(doc.fechaVencimiento);
        const row = sheet.addRow([
          TIPO_LABELS[doc.tipo] || doc.tipo,
          doc.nombreArchivo,
          formatDate(doc.createdAt),
          formatDate(doc.fechaVencimiento),
          estado
        ]);

        row.height = 20;

        // Color estado cell
        const estadoCell = row.getCell(5);
        estadoCell.fill = estado === 'VIGENTE' ? greenFill : redFill;
        estadoCell.font = { ...whiteFont, bold: true, size: 10 };
        estadoCell.alignment = { horizontal: 'center', vertical: 'middle' };

        row.eachCell((cell, colNumber) => {
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FF2D333B' } }
          };
          if (colNumber !== 5) {
            cell.font = normalFont;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1117' } };
          }
        });
      });
    }

    // Stats row
    sheet.addRow([]);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const vencidos = documents.filter(d => new Date(d.fechaVencimiento) < hoy).length;
    const statsRow = sheet.addRow([
      `Total documentos: ${documents.length}`,
      `Vigentes: ${documents.length - vencidos}`,
      `Vencidos: ${vencidos}`,
      '', ''
    ]);
    statsRow.eachCell((cell) => {
      cell.font = { ...normalFont, bold: true, color: { argb: 'FFAAAAAA' } };
      cell.fill = sectionFill;
    });

    // Set response headers
    const fileName = `MIDDI_${worker.nombre.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exportando Excel:', error);
    res.status(500).json({ error: 'Error al exportar Excel.' });
  }
};

// Export to PDF
const exportPDF = async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.params.id, empresa: req.empresa });
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado.' });

    const documents = await Document.find({ workerId: worker._id }).sort({ fechaVencimiento: 1 });
    const company = COMPANIES[req.empresa];

    const fileName = `MIDDI_${worker.nombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Colors
    const BG_DARK = '#0D1117';
    const BG_MID = '#161B22';
    const ACCENT = '#1A237E';
    const GREEN = '#00C853';
    const RED = '#D50000';
    const TEXT_MAIN = '#E6EDF3';
    const TEXT_SUB = '#8B949E';

    const W = doc.page.width - 100;

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG_DARK);

    // Header bar
    doc.rect(0, 0, doc.page.width, 90).fill(BG_MID);

    // Title
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22)
      .text('MIDDI', 50, 20);
    doc.fillColor(TEXT_SUB).font('Helvetica').fontSize(10)
      .text('Sistema de Gestión Documental', 50, 46);

    // Company badge
    doc.roundedRect(doc.page.width - 180, 20, 130, 50, 6).fill(ACCENT);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11)
      .text(company.name, doc.page.width - 180, 35, { width: 130, align: 'center' });

    // Date
    doc.fillColor(TEXT_SUB).font('Helvetica').fontSize(8)
      .text(`Generado: ${formatDate(new Date())}`, 50, 70);

    // Worker section
    doc.y = 115;
    doc.rect(50, doc.y, W, 28).fill(ACCENT);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11)
      .text('DATOS DEL TRABAJADOR', 60, doc.y + 8);
    doc.y += 28;

    const workerFields = [
      ['Nombre', worker.nombre],
      ['RUT', worker.rut],
      ['Cargo', worker.cargo],
      ['Empresa', company.name],
      ['Fecha de Registro', formatDate(worker.createdAt)]
    ];

    workerFields.forEach(([label, value], i) => {
      const rowY = doc.y;
      const rowBg = i % 2 === 0 ? BG_MID : '#1C2128';
      doc.rect(50, rowY, W, 24).fill(rowBg);
      doc.fillColor(TEXT_SUB).font('Helvetica-Bold').fontSize(9)
        .text(label, 60, rowY + 7, { width: 150 });
      doc.fillColor(TEXT_MAIN).font('Helvetica').fontSize(9)
        .text(value, 210, rowY + 7, { width: W - 160 });
      doc.y += 24;
    });

    // Documents section
    doc.y += 20;
    if (doc.y > 680) { doc.addPage(); doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG_DARK); doc.y = 50; }

    doc.rect(50, doc.y, W, 28).fill('#0D1117');
    doc.rect(50, doc.y, W, 28).stroke('#333333');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11)
      .text('DOCUMENTOS', 60, doc.y + 8);
    doc.y += 28;

    // Table header
    const colWidths = [W * 0.28, W * 0.30, W * 0.20, W * 0.14];
    const colX = [50, 50 + colWidths[0], 50 + colWidths[0] + colWidths[1], 50 + colWidths[0] + colWidths[1] + colWidths[2]];
    const headers = ['TIPO', 'ARCHIVO', 'VENCIMIENTO', 'ESTADO'];

    const thY = doc.y;
    doc.rect(50, thY, W, 22).fill('#0D1117');
    headers.forEach((h, i) => {
      doc.fillColor(TEXT_SUB).font('Helvetica-Bold').fontSize(8)
        .text(h, colX[i] + 4, thY + 6, { width: colWidths[i] - 8 });
    });
    doc.y += 22;

    if (documents.length === 0) {
      const emptyY = doc.y;
      doc.rect(50, emptyY, W, 30).fill(BG_MID);
      doc.fillColor(TEXT_SUB).font('Helvetica').fontSize(10)
        .text('Sin documentos registrados', 50, emptyY + 9, { width: W, align: 'center' });
      doc.y += 30;
    } else {
      documents.forEach((document, i) => {
        if (doc.y > 720) {
          doc.addPage();
          doc.rect(0, 0, doc.page.width, doc.page.height).fill(BG_DARK);
          doc.y = 50;
        }
        const rowY = doc.y;
        const rowBg = i % 2 === 0 ? BG_MID : '#1C2128';
        doc.rect(50, rowY, W, 26).fill(rowBg);

        const estado = getEstado(document.fechaVencimiento);
        const values = [
          TIPO_LABELS[document.tipo] || document.tipo,
          document.nombreArchivo.substring(0, 30) + (document.nombreArchivo.length > 30 ? '...' : ''),
          formatDate(document.fechaVencimiento),
          estado
        ];

        values.forEach((v, j) => {
          if (j === 3) {
            const badgeColor = estado === 'VIGENTE' ? GREEN : RED;
            const badgeX = colX[j] + 2;
            const badgeW = colWidths[j] - 10;
            doc.roundedRect(badgeX, rowY + 5, badgeW, 16, 3).fill(badgeColor);
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7)
              .text(v, badgeX, rowY + 9, { width: badgeW, align: 'center' });
          } else {
            doc.fillColor(TEXT_MAIN).font('Helvetica').fontSize(8)
              .text(v, colX[j] + 4, rowY + 8, { width: colWidths[j] - 8 });
          }
        });
        doc.y += 26;
      });
    }

    // Summary
    doc.y += 15;
    const hoy2 = new Date(); hoy2.setHours(0, 0, 0, 0);
    const vencidos = documents.filter(d => new Date(d.fechaVencimiento) < hoy2).length;
    const vigentes = documents.length - vencidos;

    doc.rect(50, doc.y, W, 40).fill(BG_MID);
    doc.fillColor(TEXT_SUB).font('Helvetica').fontSize(9)
      .text(`Total: ${documents.length}  |  Vigentes: ${vigentes}  |  Vencidos: ${vencidos}`, 60, doc.y + 14, { width: W });

    // Footer
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY, doc.page.width, 40).fill(BG_MID);
    doc.fillColor(TEXT_SUB).font('Helvetica').fontSize(8)
      .text('MIDDI - Sistema de Gestión Documental | Documento generado automáticamente', 50, footerY + 14, {
        width: doc.page.width - 100, align: 'center'
      });

    doc.end();
  } catch (error) {
    console.error('Error exportando PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al exportar PDF.' });
    }
  }
};

module.exports = { exportExcel, exportPDF };
