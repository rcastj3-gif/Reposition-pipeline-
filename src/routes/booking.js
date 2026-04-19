const express = require('express');
const router = express.Router();
const db = require('../db');

function defaultBookingLink(contactId) {
  const base = process.env.BOOKING_BASE_URL || 'https://booking.example.com/schedule';
  return `${base}?contact=${encodeURIComponent(contactId)}`;
}

router.post('/:replyId/link', (req, res) => {
  try {
    const { bookingLink } = req.body;
    const reply = db.prepare('SELECT * FROM replies WHERE id = ?').get(req.params.replyId);
    if (!reply) return res.status(404).json({ error: 'Reply not found' });

    const finalLink = bookingLink || defaultBookingLink(reply.contact_id);
    db.prepare(`
      UPDATE replies
      SET booking_link = ?, booking_status = 'ready', next_action = 'booking_link_sent'
      WHERE id = ?
    `).run(finalLink, req.params.replyId);

    res.json({ success: true, replyId: Number(req.params.replyId), bookingLink: finalLink, bookingStatus: 'ready', nextAction: 'booking_link_sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:replyId/mark-booked', (req, res) => {
  try {
    const { appointmentTime, recoveredValue, bookingNotes } = req.body;
    const result = db.prepare(`
      UPDATE replies
      SET booking_status = 'booked', appointment_status = 'booked', appointment_time = ?, recovered_value = COALESCE(?, recovered_value), booking_notes = COALESCE(?, booking_notes), next_action = 'prepare_for_appointment'
      WHERE id = ?
    `).run(appointmentTime || null, recoveredValue ?? null, bookingNotes || null, req.params.replyId);
    if (!result.changes) return res.status(404).json({ error: 'Reply not found' });
    res.json({ success: true, replyId: Number(req.params.replyId), bookingStatus: 'booked', appointmentStatus: 'booked' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:replyId/mark-completed', (req, res) => {
  try {
    const { recoveredValue, bookingNotes } = req.body;
    const result = db.prepare(`
      UPDATE replies
      SET booking_status = 'completed', appointment_status = 'completed', recovered_value = COALESCE(?, recovered_value), booking_notes = COALESCE(?, booking_notes), next_action = 'closed_won'
      WHERE id = ?
    `).run(recoveredValue ?? null, bookingNotes || null, req.params.replyId);
    if (!result.changes) return res.status(404).json({ error: 'Reply not found' });
    res.json({ success: true, replyId: Number(req.params.replyId), bookingStatus: 'completed', appointmentStatus: 'completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
