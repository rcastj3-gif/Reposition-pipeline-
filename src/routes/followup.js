const express = require('express');
const router = express.Router();
const db = require('../db');

function contact(contactId) {
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
}

function buildFollowup(reply, c) {
  const firstName = c?.first_name || 'there';
  const service = 'your inquiry';

  if (reply.classification === 'objection' && reply.subtype === 'price') {
    return {
      subject: 'A simpler option for moving forward',
      body: `Hey ${firstName},\n\nTotally understand — if price is the main thing in the way right now, we can look at a simpler starting option or a payment structure that feels easier to move on.\n\nIf you want, I can send over the best next-step option without any pressure.\n\n— Reyes`
    };
  }

  if (reply.classification === 'objection' && reply.subtype === 'timing') {
    return {
      subject: 'We can revisit this when timing is better',
      body: `Hey ${firstName},\n\nThat makes sense. Timing matters.\n\nIf it helps, I can send over a few booking windows for later this week or next, and you can grab one only if it fits.\n\n— Reyes`
    };
  }

  if (reply.classification === 'objection' && reply.subtype === 'trust') {
    return {
      subject: 'Happy to give you more clarity',
      body: `Hey ${firstName},\n\nFair question. If you want, I can send a little more context on what this process looks like, what happens next, and what other people typically use it for before you decide anything.\n\n— Reyes`
    };
  }

  if (reply.classification === 'question') {
    return {
      subject: 'Answering your question',
      body: `Hey ${firstName},\n\nHappy to help with that. If you send me the main question or concern you want clarified, I can point you in the right direction and give you the cleanest next step.\n\n— Reyes`
    };
  }

  return {
    subject: 'Quick follow-up',
    body: `Hey ${firstName},\n\nJust wanted to follow up and make this easy. If you want to move forward, I can send the next step. If not, no pressure at all.\n\n— Reyes`
  };
}

router.post('/:replyId/draft', (req, res) => {
  try {
    const reply = db.prepare('SELECT * FROM replies WHERE id = ?').get(req.params.replyId);
    if (!reply) return res.status(404).json({ error: 'Reply not found' });
    const c = contact(reply.contact_id);
    const draft = buildFollowup(reply, c);
    res.json({ success: true, replyId: Number(req.params.replyId), contactId: reply.contact_id, contactName: `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || reply.contact_id, classification: reply.classification, subtype: reply.subtype, draft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
