const fs = require('fs');
const path = require('path');

class Mailer {
  constructor() {
    this.baseUrl = process.env.AGENTMAIL_BASE_URL || 'https://api.agentmail.to/v0';
    this.senderInbox = process.env.REPORT_SENDER_INBOX || 'reyes@agentmail.to';
    this.apiKey = process.env.AGENTMAIL_API_KEY || this.getApiKeyFromOpenClawConfig();
  }

  getApiKeyFromOpenClawConfig() {
    try {
      const configPath = path.join(process.env.HOME || '/root', '.openclaw', 'openclaw.json');
      const raw = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      return parsed?.skills?.entries?.agentmail?.apiKey || null;
    } catch (error) {
      return null;
    }
  }

  async sendReport({ reportId, clientName, clientEmail, htmlPath, pdfPath }) {
    if (!this.apiKey) {
      throw new Error('AgentMail API key not found in env or ~/.openclaw/openclaw.json');
    }

    if (!clientEmail) {
      throw new Error('Client email is required to send report');
    }

    const rawHtml = fs.readFileSync(htmlPath, 'utf8');
    const Reporter = require('./reporter');
    const html = new Reporter().emailWrapper({ clientName, reportHtml: rawHtml });
    const text = `Pipeline Restoration Audit Report for ${clientName}\n\nYour audit report is included in this email. Review the top restoration opportunities and drafted messaging recommendations, then reply if you want implementation support.`;

    const attachments = [];
    if (pdfPath && fs.existsSync(pdfPath)) {
      attachments.push({
        filename: path.basename(pdfPath),
        content: fs.readFileSync(pdfPath).toString('base64'),
        content_type: 'application/pdf'
      });
    }

    const response = await fetch(`${this.baseUrl}/inboxes/${encodeURIComponent(this.senderInbox)}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: [clientEmail],
        subject: `Pipeline Restoration Audit - ${clientName}`,
        text,
        html,
        attachments
      })
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = body?.error?.message || body?.message || `AgentMail send failed with status ${response.status}`;
      throw new Error(message);
    }

    const logPath = `/tmp/report-send-${reportId}.json`;
    fs.writeFileSync(logPath, JSON.stringify({
      reportId,
      clientName,
      clientEmail,
      htmlPath,
      sentAt: new Date().toISOString(),
      mode: 'agentmail_api',
      response: body
    }, null, 2));

    return { success: true, mode: 'agentmail_api', logPath, providerResponse: body };
  }
}

module.exports = Mailer;
