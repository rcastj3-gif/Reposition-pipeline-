const express = require('express');
const router = express.Router();
const db = require('../db');
const Classifier = require('../services/classifier');

const classifier = new Classifier();

function contactName(contactId) {
  const c = db.prepare('SELECT first_name, last_name FROM contacts WHERE id = ?').get(contactId);
  if (!c) return contactId;
  return `${c.first_name || ''} ${c.last_name || ''}`.trim() || contactId;
}

router.post('/', (req, res) => {
  try {
    const { contactId, replyText } = req.body;
    if (!contactId || !replyText) return res.status(400).json({ error: 'contactId and replyText are required' });

    const result = classifier.classify(replyText);
    const bookingStatus = classifier.bookingReadiness(result);

    let nextAction = 'manual_review';
    if (result.classification === 'warm') nextAction = 'send_booking_link';
    else if (result.classification === 'question') nextAction = 'answer_question';
    else if (result.classification === 'objection') nextAction = `handle_${result.subtype}_objection`;
    else if (result.classification === 'cold') nextAction = 'close_out';

    const stmt = db.prepare(`
      INSERT INTO replies (contact_id, reply_text, classification, subtype, confidence, booking_status, next_action)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insert = stmt.run(contactId, replyText, result.classification, result.subtype, result.confidence, bookingStatus, nextAction);

    res.json({
      success: true,
      replyId: insert.lastInsertRowid,
      contactId,
      contactName: contactName(contactId),
      replyText,
      ...result,
      bookingStatus,
      nextAction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT r.*, c.first_name, c.last_name, c.email
      FROM replies r
      LEFT JOIN contacts c ON c.id = r.contact_id
      ORDER BY r.classified_at DESC
      LIMIT ?
    `).all(parseInt(req.query.limit || '50', 10));

    const replies = rows.map((r) => ({
      ...r,
      contact_name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.contact_id
    }));

    res.json({ total: replies.length, replies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/booking', (req, res) => {
  try {
    const { bookingStatus, nextAction, bookingLink, appointmentStatus, appointmentTime, recoveredValue, bookingNotes } = req.body;
    const result = db.prepare(`
      UPDATE replies
      SET booking_status = COALESCE(?, booking_status),
          next_action = COALESCE(?, next_action),
          booking_link = COALESCE(?, booking_link),
          appointment_status = COALESCE(?, appointment_status),
          appointment_time = COALESCE(?, appointment_time),
          recovered_value = COALESCE(?, recovered_value),
          booking_notes = COALESCE(?, booking_notes)
      WHERE id = ?
    `).run(
      bookingStatus || null,
      nextAction || null,
      bookingLink || null,
      appointmentStatus || null,
      appointmentTime || null,
      recoveredValue ?? null,
      bookingNotes || null,
      req.params.id
    );
    if (!result.changes) return res.status(404).json({ error: 'Reply not found' });
    res.json({ success: true, id: Number(req.params.id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
