const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const db = require('../db');
const Reporter = require('../services/reporter');
const Mailer = require('../services/mailer');
const PdfExporter = require('../services/pdf-exporter');

const reporter = new Reporter();
const mailer = new Mailer();
const pdfExporter = new PdfExporter();

function getScored(limit = 10) {
  const stmt = db.prepare(`
    SELECT s.contact_id, s.score, s.urgency_score, s.budget_score, s.engagement_score, s.timeline_score, s.days_since_activity, s.scored_at,
           c.first_name, c.last_name, c.email
    FROM scores s
    LEFT JOIN contacts c ON c.id = s.contact_id
    ORDER BY s.score DESC, s.scored_at DESC
    LIMIT ?
  `);
  const rows = stmt.all(limit);
  return rows.map((row) => ({
    contactId: row.contact_id,
    name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.contact_id,
    email: row.email || null,
    score: row.score,
    daysSinceActivity: row.days_since_activity,
    breakdown: {
      urgency: row.urgency_score,
      budget: row.budget_score,
      engagement: row.engagement_score,
      timeline: row.timeline_score,
    },
    scoredAt: row.scored_at,
  }));
}

function getDrafts(limit = 10) {
  const stmt = db.prepare(`
    SELECT d.id, d.contact_id, d.subject, d.body, d.pattern, d.status, d.created_at,
           c.first_name, c.last_name, c.email
    FROM drafts d
    LEFT JOIN contacts c ON c.id = d.contact_id
    ORDER BY d.created_at DESC
    LIMIT ?
  `);
  const rows = stmt.all(limit);
  return rows.map((row) => ({
    id: row.id,
    contactId: row.contact_id,
    name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.contact_id,
    email: row.email || null,
    subject: row.subject,
    body: row.body,
    pattern: row.pattern,
    patternName: row.pattern,
    status: row.status,
    createdAt: row.created_at,
  }));
}

async function exportReportFiles({ clientName, dormantCount = 0, limit = 10, outDir = '/tmp' }) {
  const scored = getScored(limit);
  const drafts = getDrafts(limit);
  const summary = reporter.buildSummary({ dormantCount, scored, drafts });
  const generatedAt = new Date().toISOString();
  const safeName = clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const mdPath = path.join(outDir, `${safeName}-pipeline-restoration-report.md`);
  const htmlPath = path.join(outDir, `${safeName}-pipeline-restoration-report.html`);
  const pdfPath = path.join(outDir, `${safeName}-pipeline-restoration-report.pdf`);

  fs.writeFileSync(mdPath, reporter.toMarkdown({ clientName, generatedAt, summary, scored, drafts }), 'utf8');
  fs.writeFileSync(htmlPath, reporter.toHtml({ clientName, generatedAt, summary, scored, drafts }), 'utf8');
  await pdfExporter.export({ clientName, generatedAt, summary, scored, drafts, outPath: pdfPath });

  return { markdownPath: mdPath, htmlPath, pdfPath, summary, generatedAt, scored, drafts };
}

router.get('/generate', (req, res) => {
  try {
    const clientName = req.query.clientName || 'Client';
    const format = req.query.format || 'json';
    const dormantCount = parseInt(req.query.dormantCount || '0', 10);
    const scored = getScored(parseInt(req.query.limit || '10', 10));
    const drafts = getDrafts(parseInt(req.query.limit || '10', 10));
    const summary = reporter.buildSummary({ dormantCount, scored, drafts });
    const generatedAt = new Date().toISOString();

    if (format === 'markdown') {
      return res.type('text/markdown').send(
        reporter.toMarkdown({ clientName, generatedAt, summary, scored, drafts })
      );
    }

    if (format === 'html') {
      return res.type('text/html').send(
        reporter.toHtml({ clientName, generatedAt, summary, scored, drafts })
      );
    }

    res.json({ clientName, generatedAt, summary, scored, drafts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/export', async (req, res) => {
  try {
    const clientName = req.body.clientName || 'Client';
    const dormantCount = parseInt(req.body.dormantCount || '0', 10);
    const outDir = req.body.outDir || '/tmp';
    const limit = parseInt(req.body.limit || '10', 10);
    const result = await exportReportFiles({ clientName, dormantCount, outDir, limit });
    res.json({ success: true, markdownPath: result.markdownPath, htmlPath: result.htmlPath, pdfPath: result.pdfPath, summary: result.summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function createFromRecord(req, res) {
  try {
    const record = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!record) return res.status(404).send('Report record not found');

    const result = await exportReportFiles({
      clientName: record.client_name,
      dormantCount: record.dormant_count,
      outDir: '/tmp',
      limit: 10,
    });

    db.prepare(`UPDATE reports SET markdown_path = ?, html_path = ?, pdf_path = ?, report_status = 'ready_to_send' WHERE id = ?`)
      .run(result.markdownPath, result.htmlPath, result.pdfPath, req.params.id);

    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/operator');
    }

    res.json({ success: true, id: Number(req.params.id), ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

router.post('/create-from-record/:id', createFromRecord);
router.get('/create-from-record/:id', createFromRecord);

router.get('/list', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all();
    res.json({ total: rows.length, reports: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/mark-paid', (req, res) => {
  try {
    const result = db.prepare(`UPDATE reports SET payment_status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Report not found' });
    res.json({ success: true, id: Number(req.params.id), paymentStatus: 'paid' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/send', (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    if (report.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not marked received. Cannot send report yet.' });
    }
    if (!report.html_path) {
      return res.status(400).json({ error: 'Report has no exported HTML file yet.' });
    }
    if (report.report_status === 'sent' && !req.query.force) {
      return res.status(400).json({ error: 'Report already sent. Use resend flow if needed.' });
    }

    Promise.resolve(mailer.sendReport({
      reportId: report.id,
      clientName: report.client_name,
      clientEmail: report.client_email,
      htmlPath: report.html_path,
      pdfPath: report.pdf_path,
    }))
      .then((sendResult) => {
        db.prepare(`UPDATE reports SET report_status = 'sent', sent_at = CURRENT_TIMESTAMP, send_log_path = ?, send_count = COALESCE(send_count,0) + 1, last_error = NULL WHERE id = ?`).run(sendResult.logPath || null, req.params.id);
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
          return res.redirect('/operator?success=' + encodeURIComponent('Report sent to ' + report.client_email));
        }
        res.json({ success: true, id: Number(req.params.id), reportStatus: 'sent', delivery: sendResult });
      })
      .catch((error) => {
        db.prepare(`UPDATE reports SET last_error = ? WHERE id = ?`).run(error.message, req.params.id);
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
          return res.redirect('/operator?error=' + encodeURIComponent(error.message));
        }
        res.status(500).json({ error: error.message });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
