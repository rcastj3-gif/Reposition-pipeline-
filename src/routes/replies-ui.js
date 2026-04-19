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

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, c.first_name, c.last_name, c.email
    FROM replies r
    LEFT JOIN contacts c ON c.id = r.contact_id
    ORDER BY r.classified_at DESC
  `).all();

  const cards = rows.map((r) => {
    const canSendBooking = r.booking_status === 'ready' || (r.classification === 'warm' && !r.booking_link);
    return `
      <div style="background:#fff;border:1px solid #ddd;border-radius:12px;padding:16px;margin-bottom:14px;">
        <div><strong>${esc(`${r.first_name || ''} ${r.last_name || ''}`.trim() || r.contact_id)}</strong> ${r.email ? `• ${esc(r.email)}` : ''}</div>
        <div style="color:#666;font-size:13px;margin:6px 0;">${esc(r.classified_at)}</div>
        <div style="margin:10px 0;padding:10px;background:#f8f8f8;border-radius:8px;">${esc(r.reply_text)}</div>
        <div style="font-size:14px;margin-bottom:10px;">
          <strong>Classification:</strong> ${esc(r.classification)} / ${esc(r.subtype || '')} •
          <strong>Confidence:</strong> ${esc(r.confidence || '')} •
          <strong>Booking:</strong> ${esc(r.booking_status || 'not_ready')} •
          <strong>Appointment:</strong> ${esc(r.appointment_status || 'not_booked')} •
          <strong>Next action:</strong> ${esc(r.next_action || 'manual_review')}
        </div>
        <div style="font-size:13px;color:#666;margin-bottom:10px;">
          ${r.booking_link ? `Booking link: <a href="${esc(r.booking_link)}" target="_blank">open</a> • ` : ''}
          ${r.appointment_time ? `Appointment time: ${esc(r.appointment_time)} • ` : ''}
          Recovered value: $${Number(r.recovered_value || 0).toFixed(2)}
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <form method="post" action="/replies/${r.id}/send-booking-link">
            <button ${canSendBooking ? '' : 'disabled'}>Send Booking Link</button>
          </form>
          <form method="post" action="/replies/${r.id}/mark-booked">
            <button ${r.classification === 'warm' || r.booking_link ? '' : 'disabled'}>Mark Booked</button>
          </form>
          <form method="post" action="/replies/${r.id}/mark-completed" style="display:flex;gap:8px;align-items:center;">
            <input name="recoveredValue" type="number" step="0.01" min="0" placeholder="Recovered $" style="padding:8px 10px;border:1px solid #ccc;border-radius:8px;width:120px;" />
            <button ${r.appointment_status === 'booked' ? '' : 'disabled'}>Mark Completed</button>
          </form>
          <a href="/replies/${r.id}/followup" style="color:#111;">View Follow-up Draft</a>
        </div>
      </div>
    `;
  }).join('');

  res.send(`<!doctype html><html><head><meta charset="utf-8" /><title>Reply Classification</title><style>body{font-family:Arial,sans-serif;padding:24px;background:#fafafa;color:#222;max-width:1000px;margin:0 auto}a{color:#111}button{padding:10px 12px;border:1px solid #ccc;background:#fff;border-radius:8px;cursor:pointer}button[disabled]{opacity:.5;cursor:not-allowed}</style></head><body><div style="display:flex;justify-content:space-between;align-items:center;"><h1>Reply Classification + Booking</h1><a href="/operator">Back to operator</a></div>${cards || '<p>No replies classified yet.</p>'}</body></html>`);
});

router.post('/:id/send-booking-link', (req, res) => {
  const bookingLink = `https://booking.example.com/schedule?reply=${encodeURIComponent(req.params.id)}`;
  db.prepare(`UPDATE replies SET booking_link = ?, booking_status = 'ready', next_action = 'booking_link_sent' WHERE id = ?`).run(bookingLink, req.params.id);
  res.redirect('/replies');
});

router.post('/:id/mark-booked', (req, res) => {
  db.prepare(`UPDATE replies SET booking_status = 'booked', appointment_status = 'booked', appointment_time = CURRENT_TIMESTAMP, next_action = 'prepare_for_appointment' WHERE id = ?`).run(req.params.id);
  res.redirect('/replies');
});

router.post('/:id/mark-completed', express.urlencoded({ extended: false }), (req, res) => {
  const manualValue = req.body.recoveredValue ? Number(req.body.recoveredValue) : null;
  db.prepare(`
    UPDATE replies
    SET booking_status = 'completed',
        appointment_status = 'completed',
        recovered_value = CASE
          WHEN ? IS NOT NULL THEN ?
          WHEN recovered_value IS NULL OR recovered_value = 0 THEN 1000
          ELSE recovered_value
        END,
        next_action = 'closed_won'
    WHERE id = ?
  `).run(manualValue, manualValue, req.params.id);
  res.redirect('/replies');
});

router.get('/:id/followup', (req, res) => {
  const reply = db.prepare('SELECT * FROM replies WHERE id = ?').get(req.params.id);
  if (!reply) return res.status(404).send('Reply not found');
  const c = db.prepare('SELECT * FROM contacts WHERE id = ?').get(reply.contact_id);

  let subject = 'Quick follow-up';
  let body = 'No follow-up draft available.';
  if (reply.classification === 'objection' && reply.subtype === 'price') {
    subject = 'A simpler option for moving forward';
    body = `Hey ${c?.first_name || 'there'},\n\nTotally understand — if price is the main thing in the way right now, we can look at a simpler starting option or a payment structure that feels easier to move on.\n\nIf you want, I can send over the best next-step option without any pressure.\n\n— Reyes`;
  } else if (reply.classification === 'objection' && reply.subtype === 'timing') {
    subject = 'We can revisit this when timing is better';
    body = `Hey ${c?.first_name || 'there'},\n\nThat makes sense. Timing matters.\n\nIf it helps, I can send over a few booking windows for later this week or next, and you can grab one only if it fits.\n\n— Reyes`;
  } else if (reply.classification === 'question') {
    subject = 'Answering your question';
    body = `Hey ${c?.first_name || 'there'},\n\nHappy to help with that. If you send me the main question or concern you want clarified, I can point you in the right direction and give you the cleanest next step.\n\n— Reyes`;
  }

  res.send(`<!doctype html><html><head><meta charset="utf-8" /><title>Follow-up Draft</title><style>body{font-family:Arial,sans-serif;padding:24px;background:#fafafa;color:#222;max-width:900px;margin:0 auto}pre{white-space:pre-wrap;background:#fff;border:1px solid #ddd;border-radius:12px;padding:16px}a{color:#111}</style></head><body><div style="display:flex;justify-content:space-between;align-items:center;"><h1>Follow-up Draft</h1><a href="/replies">Back to replies</a></div><p><strong>Subject:</strong> ${subject}</p><pre>${body}</pre></body></html>`);
});

module.exports = router;
