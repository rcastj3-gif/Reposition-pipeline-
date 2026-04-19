class Classifier {
  classify(text = '') {
    const raw = text.trim();
    const t = raw.toLowerCase();

    // objections should beat general interest if both appear
    if (/(price|cost|too expensive|expensive|budget|afford)/i.test(raw)) {
      return { classification: 'objection', subtype: 'price', confidence: 'high' };
    }
    if (/(later|not now|busy|timing|after|next month|next week|circle back)/i.test(raw)) {
      return { classification: 'objection', subtype: 'timing', confidence: 'medium' };
    }
    if (/(not sure|need to think|thinking about it|uncertain|maybe)/i.test(raw)) {
      return { classification: 'objection', subtype: 'hesitation', confidence: 'medium' };
    }
    if (/(who are you|how did you get|legit|real|trust)/i.test(raw)) {
      return { classification: 'objection', subtype: 'trust', confidence: 'medium' };
    }

    // cold / no
    if (/(not interested|stop|unsubscribe|remove me|leave me alone|no thanks|no thank you)/i.test(raw)) {
      return { classification: 'cold', subtype: 'not_interested', confidence: 'high' };
    }

    // warm intent
    if (/(yes|interested|let's do it|lets do it|book|schedule|available|call me|send me times|i'm in|im in)/i.test(raw)) {
      return { classification: 'warm', subtype: 'ready_to_book', confidence: 'high' };
    }

    // question
    if (raw.includes('?') || /(how|what|when|where|why)/i.test(raw)) {
      return { classification: 'question', subtype: 'info_request', confidence: 'medium' };
    }

    return { classification: 'unclear', subtype: 'needs_review', confidence: 'low' };
  }

  bookingReadiness(result) {
    if (result.classification === 'warm') return 'ready';
    if (result.classification === 'question') return 'maybe';
    if (result.classification === 'objection' && result.subtype === 'timing') return 'later';
    return 'not_ready';
  }
}

module.exports = Classifier;
