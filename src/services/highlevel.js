const axios = require('axios');

class HighLevelAPI {
  constructor(apiKey, locationId) {
    this.apiKey = apiKey;
    this.locationId = locationId;
    this.baseURL = 'https://rest.gohighlevel.com/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Get all contacts with optional filters
  async getContacts(filters = {}) {
    try {
      const response = await this.client.get('/contacts', {
        params: {
          locationId: this.locationId,
          ...filters
        }
      });
      return response.data.contacts || [];
    } catch (error) {
      console.error('HighLevel API Error (getContacts):', error.response?.data || error.message);
      throw error;
    }
  }

  // Get single contact by ID
  async getContact(contactId) {
    try {
      const response = await this.client.get(`/contacts/${contactId}`, {
        params: { locationId: this.locationId }
      });
      return response.data.contact;
    } catch (error) {
      console.error('HighLevel API Error (getContact):', error.response?.data || error.message);
      throw error;
    }
  }

  // Add note to contact
  async addNote(contactId, body) {
    try {
      const response = await this.client.post(`/contacts/${contactId}/notes`, {
        body,
        locationId: this.locationId
      });
      return response.data;
    } catch (error) {
      console.error('HighLevel API Error (addNote):', error.response?.data || error.message);
      throw error;
    }
  }

  // Update opportunity stage
  async updateOpportunity(opportunityId, pipelineStageId) {
    try {
      const response = await this.client.put(`/opportunities/${opportunityId}`, {
        pipelineStageId,
        locationId: this.locationId
      });
      return response.data;
    } catch (error) {
      console.error('HighLevel API Error (updateOpportunity):', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = HighLevelAPI;
