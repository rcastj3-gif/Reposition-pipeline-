class Scorer {
  // Score a single contact (0-10 composite score)
  scoreContact(contact) {
    const urgency = this.scoreUrgency(contact);
    const budget = this.scoreBudget(contact);
    const engagement = this.scoreEngagement(contact);
    const timeline = this.scoreTimeline(contact);

    // Weighted composite score
    // Urgency = 40%, Budget = 30%, Engagement = 20%, Timeline = 10%
    const composite = Math.round(
      urgency * 0.4 +
      budget * 0.3 +
      engagement * 0.2 +
      timeline * 0.1
    );

    return {
      total: Math.min(composite, 10), // Cap at 10
      urgency,
      budget,
      engagement,
      timeline
    };
  }

  // Urgency signals (0-10)
  scoreUrgency(contact) {
    const notes = (contact.notes || '').toLowerCase();
    const customFields = contact.customFields || {};
    let score = 0;

    // Check custom fields first
    if (customFields.urgency) {
      const urgencyLevel = customFields.urgency.toLowerCase();
      if (urgencyLevel === 'high') score += 10;
      else if (urgencyLevel === 'medium') score += 6;
      else if (urgencyLevel === 'low') score += 3;
    }

    // Check notes for urgency keywords
    if (notes.includes('urgent') || notes.includes('asap')) score += 10;
    else if (notes.includes('soon') || notes.includes('quickly')) score += 7;
    else if (notes.includes('need')) score += 4;

    // Pain/problem severity signals
    if (notes.includes('pain') || notes.includes('suffering')) score += 5;
    if (notes.includes('problem') || notes.includes('issue')) score += 3;

    return Math.min(score, 10);
  }

  // Budget signals (0-10)
  scoreBudget(contact) {
    const notes = (contact.notes || '').toLowerCase();
    const customFields = contact.customFields || {};
    let score = 0;

    // Check objection type
    if (customFields.objection) {
      const objection = customFields.objection.toLowerCase();
      if (objection === 'price' || objection === 'budget') {
        // Price objection = they're thinking about it (not a hard no)
        score += 5;
      } else if (objection === 'none apparent') {
        // No objection = strong signal
        score += 10;
      }
    }

    // Positive budget signals
    if (notes.includes('price') && !notes.includes('too expensive')) score += 7;
    if (notes.includes('payment plan') || notes.includes('financing')) score += 6;
    if (notes.includes('budget') && !notes.includes('tight budget')) score += 5;
    if (notes.includes('quoted') || notes.includes('fair')) score += 4;
    if (notes.includes('willing to invest') || notes.includes('pre-approved')) score += 8;

    // Negative budget signals
    if (notes.includes('too expensive') || notes.includes('can\'t afford')) score -= 5;
    if (notes.includes('tight budget')) score -= 3;

    return Math.max(0, Math.min(score, 10));
  }

  // Engagement signals (0-10)
  scoreEngagement(contact) {
    const lastActivity = contact.lastActivity ? new Date(contact.lastActivity) : null;
    const notes = (contact.notes || '').toLowerCase();
    
    if (!lastActivity) return 0;

    const daysSinceActivity = Math.floor(
      (new Date() - lastActivity) / (1000 * 60 * 60 * 24)
    );

    let score = 0;

    // Recency score (more recent = higher score)
    if (daysSinceActivity < 30) score += 10;
    else if (daysSinceActivity < 60) score += 8;
    else if (daysSinceActivity < 90) score += 6;
    else if (daysSinceActivity < 180) score += 4;
    else score += 2;

    // Engagement quality signals
    if (notes.includes('very interested') || notes.includes('enthusiastic')) score += 3;
    if (notes.includes('engaged') || notes.includes('responsive')) score += 2;
    if (notes.includes('scheduled') || notes.includes('booked')) score += 2;

    // Negative engagement signals
    if (notes.includes('no-show') || notes.includes('no response')) score -= 3;
    if (notes.includes('went quiet') || notes.includes('never heard back')) score -= 2;

    return Math.max(0, Math.min(score, 10));
  }

  // Timeline signals (0-10)
  scoreTimeline(contact) {
    const notes = (contact.notes || '').toLowerCase();
    let score = 0;

    // Immediate timeline
    if (notes.includes('this week') || notes.includes('next week')) score += 10;
    if (notes.includes('this month') || notes.includes('next month')) score += 8;
    
    // Medium-term timeline
    if (notes.includes('3-6 months') || notes.includes('next few months')) score += 6;
    if (notes.includes('soon') || notes.includes('looking to')) score += 5;

    // Long-term timeline
    if (notes.includes('next year') || notes.includes('eventually')) score += 2;

    // Explicit timing mentions
    if (notes.includes('schedule') || notes.includes('book')) score += 4;
    if (notes.includes('ready')) score += 5;

    return Math.min(score, 10);
  }

  // Calculate days since last activity
  calculateDaysSinceActivity(contact) {
    if (!contact.lastActivity) return null;
    
    const lastActivity = new Date(contact.lastActivity);
    const now = new Date();
    return Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
  }
}

module.exports = Scorer;
