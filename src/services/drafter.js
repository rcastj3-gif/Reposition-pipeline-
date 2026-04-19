class Drafter {
  constructor() {
    this.templates = {
      patternA: {
        name: 'Checking In',
        subject: 'Quick check-in',
        body: `Hey {firstName},

I wanted to check in — we spoke {timeAgo} about {serviceInquired}.

Are you still interested, or did you decide to go a different direction?

Either way, no pressure. Just wanted to make sure you didn't fall through the cracks.

— {senderName}`
      },
      
      patternB: {
        name: 'New Option Available',
        subject: 'New option for {serviceInquired}',
        body: `Hey {firstName},

I know we talked {timeAgo} about {serviceInquired}, and at the time {reasonItDidntWork}.

I wanted to reach out because {newOption}.

If you're still interested, {callToAction}.

— {senderName}`
      },
      
      patternC: {
        name: 'Limited Availability',
        subject: 'Limited availability — {serviceInquired}',
        body: `Hey {firstName},

We're booking up fast for {serviceInquired} over the next few weeks.

I remembered you'd inquired about this {timeAgo}, so I wanted to give you first crack at the remaining slots before they're gone.

Interested? {callToAction}.

— {senderName}`
      },
      
      patternD: {
        name: 'Thought of You',
        subject: 'Thought of you',
        body: `Hey {firstName},

I was reviewing notes from our conversation {timeAgo} — you'd asked about {serviceInquired}.

I wanted to check in because {reasonToReengage}.

If you're still interested, {callToAction}.

— {senderName}`
      },

      patternE: {
        name: 'Payment Plan Option',
        subject: 'Payment plan now available',
        body: `Hey {firstName},

I know when we talked {timeAgo} about {serviceInquired}, budget was a concern.

Good news: we now offer flexible payment plans that make it much more manageable.

Worth a quick conversation to see if it works for you?

— {senderName}`
      }
    };
  }

  // Draft a message for a contact
  draft(contact, pattern = 'patternD', context = {}) {
    // Auto-detect best pattern based on contact data if pattern is 'auto'
    if (pattern === 'auto') {
      pattern = this.detectBestPattern(contact);
    }
    
    const template = this.templates[pattern];
    if (!template) {
      throw new Error(`Unknown pattern: ${pattern}`);
    }

    // Build personalization variables
    const vars = this.buildVariables(contact, context);

    // Replace variables in subject and body
    let subject = this.replaceVariables(template.subject, vars);
    let body = this.replaceVariables(template.body, vars);

    return {
      pattern: pattern,
      patternName: template.name,
      subject,
      body,
      variables: vars
    };
  }

  // Build personalization variables
  buildVariables(contact, context) {
    return {
      firstName: contact.firstName || 'there',
      lastName: contact.lastName || '',
      fullName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'there',
      timeAgo: this.calculateTimeAgo(contact.lastActivity),
      serviceInquired: context.serviceInquired || contact.customFields?.serviceInquired || 'our services',
      reasonItDidntWork: context.reasonItDidntWork || this.detectReasonFromNotes(contact) || 'timing wasn\'t right',
      newOption: context.newOption || 'we have some new availability',
      reasonToReengage: context.reasonToReengage || this.generateReasonToReengage(contact),
      callToAction: context.callToAction || 'let me know and I can get you scheduled',
      senderName: context.senderName || 'Reyes'
    };
  }

  // Replace variables in text
  replaceVariables(text, vars) {
    let result = text;
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  // Calculate human-readable time ago
  calculateTimeAgo(lastActivity) {
    if (!lastActivity) return 'a while back';

    const lastDate = new Date(lastActivity);
    const now = new Date();
    const days = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    if (days < 14) return 'a couple weeks ago';
    if (days < 30) return 'a few weeks back';
    if (days < 45) return 'last month';
    if (days < 60) return 'a couple months back';
    if (days < 90) return 'a few months back';
    if (days < 180) return 'earlier this year';
    if (days < 365) return 'last year';
    return 'a while back';
  }

  // Detect reason from notes
  detectReasonFromNotes(contact) {
    const notes = (contact.notes || '').toLowerCase();
    
    if (notes.includes('price') || notes.includes('budget')) {
      return 'budget was a concern';
    }
    if (notes.includes('timing') || notes.includes('busy')) {
      return 'timing wasn\'t right';
    }
    if (notes.includes('think about it') || notes.includes('get back')) {
      return 'you needed time to think';
    }
    if (notes.includes('other quotes') || notes.includes('shopping')) {
      return 'you wanted to compare options';
    }
    
    return 'timing wasn\'t right';
  }

  // Generate reason to reengage based on contact data
  generateReasonToReengage(contact) {
    const objection = contact.customFields?.objection?.toLowerCase();
    
    if (objection === 'price' || objection === 'budget') {
      return 'we now have flexible payment options';
    }
    if (objection === 'timing') {
      return 'we have availability this week';
    }
    if (objection === 'fear/uncertainty') {
      return 'I wanted to share some recent results that might help';
    }
    
    return 'we have availability coming up';
  }

  // Detect best pattern based on contact data
  detectBestPattern(contact) {
    const objection = contact.customFields?.objection?.toLowerCase() || '';
    const urgency = contact.customFields?.urgency?.toLowerCase() || '';
    const notes = (contact.notes || '').toLowerCase();
    
    // Pattern E: Payment plan (if budget objection)
    if (objection.includes('price') || objection.includes('budget')) {
      return 'patternE';
    }
    
    // Pattern C: Limited availability (if high urgency)
    if (urgency === 'high' || notes.includes('urgent') || notes.includes('soon')) {
      return 'patternC';
    }
    
    // Pattern B: New option (if had timing or other issue)
    if (objection.includes('timing') || notes.includes('went quiet')) {
      return 'patternB';
    }
    
    // Pattern D: Thought of you (default, safest)
    return 'patternD';
  }

  // Get all available patterns
  getPatterns() {
    return Object.keys(this.templates).map(key => ({
      key,
      name: this.templates[key].name
    }));
  }
}

module.exports = Drafter;
