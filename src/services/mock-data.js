// Mock HighLevel contact data for testing
// This simulates what a real HighLevel API would return

const mockContacts = [
  {
    id: 'contact_001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1-555-0101',
    lastActivity: '2025-11-15T10:30:00Z', // 4+ months ago
    tags: ['med_spa_inquiry', 'botox_interest'],
    notes: 'Inquired about Botox for fine lines around eyes. Mentioned wanting natural-looking results. Asked about price - quoted $450. Said she needed to think about it. Follow-up: she seems interested but timing might be an issue.',
    source: 'Instagram',
    customFields: {
      serviceInquired: 'Botox Consultation',
      objection: 'Price',
      urgency: 'Low'
    }
  },
  {
    id: 'contact_002',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@example.com',
    phone: '+1-555-0102',
    lastActivity: '2025-12-20T14:15:00Z', // 3+ months ago
    tags: ['dental_inquiry', 'implants'],
    notes: 'Called about dental implants. Very interested. Budget is a concern but asked about payment plans. Wants to schedule consultation soon. Left voicemail 2x, no response.',
    source: 'Google Ads',
    customFields: {
      serviceInquired: 'Dental Implants Consultation',
      objection: 'Budget',
      urgency: 'High'
    }
  },
  {
    id: 'contact_003',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@example.com',
    phone: '+1-555-0103',
    lastActivity: '2026-01-10T09:00:00Z', // 2+ months ago
    tags: ['real_estate_lead', 'buyer'],
    notes: 'Looking to buy a home in the next 3-6 months. Pre-approved for $350K. Wants 3bd/2ba in the suburbs. Very responsive initially, then went quiet. Mentioned she was also talking to another agent.',
    source: 'Facebook',
    customFields: {
      serviceInquired: 'Home Buying Consultation',
      objection: 'Timing',
      urgency: 'Medium'
    }
  },
  {
    id: 'contact_004',
    firstName: 'David',
    lastName: 'Thompson',
    email: 'david.thompson@example.com',
    phone: '+1-555-0104',
    lastActivity: '2025-10-05T16:45:00Z', // 6+ months ago
    tags: ['legal_inquiry', 'personal_injury'],
    notes: 'Car accident victim. Neck pain, other driver at fault. Very interested in representation. Asked about fees - explained contingency basis. Said he would get back to us. Never heard back.',
    source: 'Referral',
    customFields: {
      serviceInquired: 'Personal Injury Consultation',
      objection: 'None apparent',
      urgency: 'High'
    }
  },
  {
    id: 'contact_005',
    firstName: 'Jessica',
    lastName: 'Martinez',
    email: 'jessica.martinez@example.com',
    phone: '+1-555-0105',
    lastActivity: '2026-02-14T11:20:00Z', // 1+ months ago
    tags: ['coaching_inquiry', 'business'],
    notes: 'Struggling business owner. Wants help with marketing and systems. Budget: $2K/month. Very enthusiastic on first call. Asked for proposal. Sent proposal, no response.',
    source: 'LinkedIn',
    customFields: {
      serviceInquired: 'Business Coaching Program',
      objection: 'Unclear',
      urgency: 'Medium'
    }
  },
  {
    id: 'contact_006',
    firstName: 'Robert',
    lastName: 'Williams',
    email: 'robert.williams@example.com',
    phone: '+1-555-0106',
    lastActivity: '2025-09-22T08:30:00Z', // 7+ months ago
    tags: ['home_services', 'hvac'],
    notes: 'AC unit not working well. Needs replacement soon. Got quote for $5,800. Said price was fair but wanted to get other quotes. Never followed up.',
    source: 'Google',
    customFields: {
      serviceInquired: 'AC Replacement',
      objection: 'Shopping around',
      urgency: 'High'
    }
  },
  {
    id: 'contact_007',
    firstName: 'Amanda',
    lastName: 'Lee',
    email: 'amanda.lee@example.com',
    phone: '+1-555-0107',
    lastActivity: '2026-03-01T13:10:00Z', // 1 month ago
    tags: ['med_spa_inquiry', 'fillers'],
    notes: 'Interested in lip fillers. First-timer, nervous about results. Wants to see before/after photos. Very engaged during consultation. Said she would book next week. Didn\'t book.',
    source: 'TikTok',
    customFields: {
      serviceInquired: 'Lip Filler Consultation',
      objection: 'Fear/uncertainty',
      urgency: 'Low'
    }
  },
  {
    id: 'contact_008',
    firstName: 'Christopher',
    lastName: 'Brown',
    email: 'christopher.brown@example.com',
    phone: '+1-555-0108',
    lastActivity: '2025-11-28T15:50:00Z', // 4+ months ago
    tags: ['coaching_inquiry', 'life_coach'],
    notes: 'Mid-career professional feeling stuck. Wants clarity on next steps. Completed intake form. Scheduled discovery call. No-showed 2x. Sent follow-up, no response.',
    source: 'Podcast',
    customFields: {
      serviceInquired: 'Life Coaching Package',
      objection: 'Commitment uncertainty',
      urgency: 'Low'
    }
  },
  {
    id: 'contact_009',
    firstName: 'Nicole',
    lastName: 'Davis',
    email: 'nicole.davis@example.com',
    phone: '+1-555-0109',
    lastActivity: '2026-01-18T10:05:00Z', // 2+ months ago
    tags: ['dental_inquiry', 'whitening'],
    notes: 'Wants teeth whitening for upcoming wedding in 6 months. Asked about in-office vs at-home options. Price-conscious but willing to invest. Said she would call back to book. Didn\'t.',
    source: 'Instagram',
    customFields: {
      serviceInquired: 'Teeth Whitening',
      objection: 'Timing',
      urgency: 'Medium'
    }
  },
  {
    id: 'contact_010',
    firstName: 'Brian',
    lastName: 'Garcia',
    email: 'brian.garcia@example.com',
    phone: '+1-555-0110',
    lastActivity: '2025-12-03T09:40:00Z', // 4+ months ago
    tags: ['real_estate_lead', 'seller'],
    notes: 'Wants to sell home to relocate for job. House worth ~$400K. Urgency depends on job offer timeline. Very interested, then company delayed the role. Asked to stay in touch. Haven\'t heard since.',
    source: 'Zillow',
    customFields: {
      serviceInquired: 'Home Selling Consultation',
      objection: 'Timing dependent on external factor',
      urgency: 'Was high, now unclear'
    }
  }
];

// Mock HighLevel API wrapper (same interface as real one)
class MockHighLevelAPI {
  constructor() {
    this.contacts = mockContacts;
  }

  // Simulate API delay
  async delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get all contacts with optional filters
  async getContacts(filters = {}) {
    await this.delay();
    return [...this.contacts]; // Return copy
  }

  // Get single contact by ID
  async getContact(contactId) {
    await this.delay();
    const contact = this.contacts.find(c => c.id === contactId);
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }
    return { ...contact }; // Return copy
  }

  // Add note to contact
  async addNote(contactId, body) {
    await this.delay();
    const contact = this.contacts.find(c => c.id === contactId);
    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }
    // Append to notes
    contact.notes = `${contact.notes}\n\n[${new Date().toISOString()}] ${body}`;
    return { success: true, note: body };
  }

  // Update opportunity stage (mock - just log it)
  async updateOpportunity(opportunityId, pipelineStageId) {
    await this.delay();
    console.log(`[MOCK] Updated opportunity ${opportunityId} to stage ${pipelineStageId}`);
    return { success: true };
  }
}

module.exports = MockHighLevelAPI;
