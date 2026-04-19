const express = require('express');
const router = express.Router();
const db = require('../db');

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(body) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pipeline Restoration Operator</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #222; background: #fafafa; max-width: 1100px; margin: 0 auto; }
    h1 { margin-bottom: 8px; }
    .muted { color: #666; margin-bottom: 20px; }
    .card { background: white; border: 1px solid #ddd; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; }
    .paid { background: #e7f8ec; color: #116329; }
    .unpaid { background: #fff3cd; color: #8a6d1d; }
    .sent { background: #e8f0ff; color: #1e4db7; }
    .ready { background: #f0f0f0; color: #333; }
    .draft { background: #f6f6f6; color: #444; }
    .errorbox, .successbox { padding: 12px 14px; border-radius: 10px; margin-bottom: 16px; font-weight: 600; }
    .errorbox { background: #fff1f1; color: #9b1c1c; border: 1px solid #f1c0c0; }
    .successbox { background: #eefbf3; color: #17643a; border: 1px solid #bfe3ca; }
    button, .btnlink { border: 0; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block; }
    .primary { background: #111; color: white; }
    .secondary { background: #ececec; color: #111; }
    .ghost { background: white; color: #111; border: 1px solid #ccc; }
    .disabled { background: #ddd; color: #888; cursor: not-allowed; }
    input { padding: 10px; border: 1px solid #ccc; border-radius: 8px; min-width: 220px; }
    form { margin: 0; }
    .grid { display: grid; grid-template-columns: 1fr auto auto auto auto; gap: 12px; align-items: center; }
    .meta { font-size: 13px; color: #666; margin-top: 8px; }
    .stack { display: flex; flex-direction: column; gap: 6px; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT id, client_name, client_email, dormant_count, payment_status, report_status, html_path, markdown_path, pdf_path, send_log_path, send_count, last_error, created_at, paid_at, sent_at
    FROM reports
    ORDER BY created_at DESC
  `).all();

  const success = req.query.success ? `<div class="successbox">${esc(req.query.success)}</div>` : '';
  const error = req.query.error ? `<div class="errorbox">${esc(req.query.error)}</div>` : '';

  const cards = rows.map((row) => {
    const canSend = row.payment_status === 'paid' && row.report_status !== 'sent' && row.html_path;
    const canResend = row.payment_status === 'paid' && row.html_path;
    return `
      <div class="card">
        <div class="grid">
          <div class="stack">
            <div><strong>${esc(row.client_name)}</strong></div>
            <div class="muted">${esc(row.client_email || 'No email set')} • Dormant leads: ${row.dormant_count} • Created: ${esc(row.created_at)}</div>
            <div class="row">
              <span class="pill ${row.payment_status === 'paid' ? 'paid' : 'unpaid'}">${esc(row.payment_status)}</span>
              <span class="pill ${row.report_status === 'sent' ? 'sent' : row.report_status === 'draft' ? 'draft' : 'ready'}">${esc(row.report_status)}</span>
              <span class="pill ready">send count: ${row.send_count || 0}</span>
            </div>
            <div class="meta">
              ${row.markdown_path ? `Markdown: <a href="/operator/file?path=${encodeURIComponent(row.markdown_path)}">view</a> • ` : ''}
              ${row.html_path ? `HTML: <a href="/operator/file?path=${encodeURIComponent(row.html_path)}">view</a> • ` : ''}
              ${row.pdf_path ? `PDF: <a href="/operator/file?path=${encodeURIComponent(row.pdf_path)}">view</a> • ` : ''}
              ${row.send_log_path ? `Send log: <a href="/operator/file?path=${encodeURIComponent(row.send_log_path)}">view</a>` : 'No send log yet'}
            </div>
            ${row.sent_at ? `<div class="meta">Sent at: ${esc(row.sent_at)}</div>` : ''}
            ${row.last_error ? `<div class="meta" style="color:#9b1c1c;">Last error: ${esc(row.last_error)}</div>` : ''}
          </div>
          <form method="post" action="/operator/report/${row.id}/mark-paid">
            <button class="secondary" ${row.payment_status === 'paid' ? 'disabled' : ''}>Mark Paid</button>
          </form>
          <form method="post" action="/operator/report/${row.id}/send">
            <button class="${canSend ? 'primary' : 'disabled'}" ${canSend ? '' : 'disabled'}>Send Report</button>
          </form>
          <form method="post" action="/operator/report/${row.id}/resend">
            <button class="${canResend ? 'ghost' : 'disabled'}" ${canResend ? '' : 'disabled'}>Resend</button>
          </form>
          <form method="post" action="/operator/report/${row.id}/regenerate">
            <button class="ghost">Regenerate</button>
          </form>
        </div>
      </div>`;
  }).join('');

  const body = `
    <div class="row" style="justify-content:space-between;align-items:center;">
      <div>
        <h1>Pipeline Restoration Operator</h1>
        <div class="muted">Generate reports, mark payment received, and send only after payment. Resend is explicit. Duplicate sends are blocked by default.</div>
      </div>
      <form method="post" action="/logout"><button class="ghost">Logout</button></form>
    </div>
    ${success}
    ${error}
    <div class="card">
      <form method="post" action="/operator/report/create" class="row">
        <input name="clientName" placeholder="Client name" required />
        <input name="clientEmail" placeholder="Client email" required />
        <input name="dormantCount" placeholder="Dormant leads" value="10" required />
        <button class="primary">Generate Report</button>
        <a class="ghost btnlink" href="/replies">Reply Review</a>
        <a class="ghost btnlink" href="/dashboard">Revenue Dashboard</a>
      </form>
    </div>
    ${cards || '<div class="card">No reports yet.</div>'}
  `;

  res.type('text/html').send(layout(body));
});

router.get('/file', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath || !filePath.startsWith('/tmp/')) {
      return res.status(400).send('Only /tmp files are allowed.');
    }
    if (filePath.endsWith('.pdf')) res.type('application/pdf');
    return res.sendFile(filePath);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/report/create', express.urlencoded({ extended: false }), (req, res) => {
  try {
    const { clientName, clientEmail, dormantCount } = req.body;
    const insert = db.prepare(`
      INSERT INTO reports (client_name, client_email, dormant_count, payment_status, report_status)
      VALUES (?, ?, ?, 'unpaid', 'draft')
    `);
    const result = insert.run(clientName, clientEmail, parseInt(dormantCount || '0', 10));
    res.redirect(`/report/create-from-record/${result.lastInsertRowid}`);
  } catch (error) {
    res.redirect('/operator?error=' + encodeURIComponent(error.message));
  }
});

router.post('/report/:id/mark-paid', (req, res) => {
  try {
    const result = db.prepare(`UPDATE reports SET payment_status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?`).run(req.params.id);
    if (!result.changes) return res.redirect('/operator?error=' + encodeURIComponent('Report not found'));
    res.redirect('/operator?success=' + encodeURIComponent('Payment marked received'));
  } catch (error) {
    res.redirect('/operator?error=' + encodeURIComponent(error.message));
  }
});

router.post('/report/:id/regenerate', (req, res) => {
  res.redirect(`/report/create-from-record/${req.params.id}`);
});

router.post('/report/:id/send', async (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.redirect('/operator?error=' + encodeURIComponent('Report not found'));
    if (report.payment_status !== 'paid') return res.redirect('/operator?error=' + encodeURIComponent('Payment not marked received yet.'));
    if (!report.html_path) return res.redirect('/operator?error=' + encodeURIComponent('No report file exported yet.'));
    if (report.report_status === 'sent') return res.redirect('/operator?error=' + encodeURIComponent('Report already sent. Use Resend if needed.'));

    const Mailer = require('../services/mailer');
    const sendResult = await new Mailer().sendReport({
      reportId: report.id,
      clientName: report.client_name,
      clientEmail: report.client_email,
      htmlPath: report.html_path,
      pdfPath: report.pdf_path,
    });

    db.prepare(`UPDATE reports SET report_status = 'sent', sent_at = CURRENT_TIMESTAMP, send_log_path = ?, send_count = COALESCE(send_count,0) + 1, last_error = NULL WHERE id = ?`).run(sendResult.logPath || null, req.params.id);
    res.redirect('/operator?success=' + encodeURIComponent(`Report sent to ${report.client_email}`));
  } catch (error) {
    db.prepare(`UPDATE reports SET last_error = ? WHERE id = ?`).run(error.message, req.params.id);
    res.redirect('/operator?error=' + encodeURIComponent(error.message));
  }
});

router.post('/report/:id/resend', async (req, res) => {
  try {
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!report) return res.redirect('/operator?error=' + encodeURIComponent('Report not found'));
    if (report.payment_status !== 'paid') return res.redirect('/operator?error=' + encodeURIComponent('Payment not marked received yet.'));
    if (!report.html_path) return res.redirect('/operator?error=' + encodeURIComponent('No report file exported yet.'));

    const Mailer = require('../services/mailer');
    const sendResult = await new Mailer().sendReport({
      reportId: report.id,
      clientName: report.client_name,
      clientEmail: report.client_email,
      htmlPath: report.html_path,
      pdfPath: report.pdf_path,
    });

    db.prepare(`UPDATE reports SET report_status = 'sent', sent_at = CURRENT_TIMESTAMP, send_log_path = ?, send_count = COALESCE(send_count,0) + 1, last_error = NULL WHERE id = ?`).run(sendResult.logPath || null, req.params.id);
    res.redirect('/operator?success=' + encodeURIComponent(`Report resent to ${report.client_email}`));
  } catch (error) {
    db.prepare(`UPDATE reports SET last_error = ? WHERE id = ?`).run(error.message, req.params.id);
    res.redirect('/operator?error=' + encodeURIComponent(error.message));
  }
});

module.exports = router;
