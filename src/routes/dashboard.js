const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const totals = db.prepare(`
    SELECT
      COUNT(*) as totalReplies,
      SUM(CASE WHEN classification = 'warm' THEN 1 ELSE 0 END) as warmReplies,
      SUM(CASE WHEN appointment_status = 'booked' THEN 1 ELSE 0 END) as booked,
      SUM(CASE WHEN appointment_status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(COALESCE(recovered_value,0)) as recovered
    FROM replies
  `).get();

  const body = `<!doctype html><html><head><meta charset="utf-8" /><title>Revenue Dashboard</title><style>
  body{font-family:Arial,sans-serif;padding:24px;background:#fafafa;color:#222;max-width:1000px;margin:0 auto}
  .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.card{background:#fff;border:1px solid #ddd;border-radius:12px;padding:18px}.num{font-size:28px;font-weight:700}.lbl{color:#666}
  a{color:#111}
  </style></head><body><div style="display:flex;justify-content:space-between;align-items:center;"><h1>Revenue Dashboard</h1><a href="/operator">Back to operator</a></div><div class="grid"><div class="card"><div class="num">${totals.totalReplies || 0}</div><div class="lbl">Replies</div></div><div class="card"><div class="num">${totals.warmReplies || 0}</div><div class="lbl">Warm Replies</div></div><div class="card"><div class="num">${totals.booked || 0}</div><div class="lbl">Booked</div></div><div class="card"><div class="num">${totals.completed || 0}</div><div class="lbl">Completed</div></div><div class="card"><div class="num">$${Number(totals.recovered || 0).toFixed(2)}</div><div class="lbl">Recovered Revenue</div></div></div></body></html>`;
  res.send(body);
});

module.exports = router;
