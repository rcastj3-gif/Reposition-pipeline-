class Reporter {
  buildSummary({ dormantCount = 0, scored = [], drafts = [] }) {
    const topScore = scored[0]?.score || 0;
    const avgScore = scored.length
      ? (scored.reduce((sum, item) => sum + item.score, 0) / scored.length).toFixed(1)
      : '0.0';

    const patternCounts = drafts.reduce((acc, d) => {
      const key = d.patternName || d.pattern || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      dormantCount,
      scoredCount: scored.length,
      draftedCount: drafts.length,
      topScore,
      avgScore,
      patternCounts
    };
  }

  emailWrapper({ clientName = 'Client', reportHtml }) {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #222; background: #f6f7fb; padding: 24px; }
    .shell { max-width: 900px; margin: 0 auto; background: white; border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb; }
    .hero { background: #111827; color: white; padding: 28px; }
    .hero h1 { margin: 0 0 8px 0; font-size: 24px; }
    .content { padding: 24px; }
    .note { background: #f3f4f6; border-left: 4px solid #111827; padding: 14px; margin-bottom: 20px; }
    .footer { color: #666; font-size: 13px; padding: 0 24px 24px 24px; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="hero">
      <h1>Pipeline Restoration Audit</h1>
      <div>${clientName}</div>
    </div>
    <div class="content">
      <div class="note">
        Your audit report is below. This report highlights dormant leads, top restoration opportunities, and drafted message patterns ready for review and execution.
      </div>
      ${reportHtml}
    </div>
    <div class="footer">
      Sent by Reyes Castillo Consulting via Pipeline Restoration.
    </div>
  </div>
</body>
</html>`;
  }

  toMarkdown({ clientName = 'Client', generatedAt, summary, scored = [], drafts = [] }) {
    const patternLines = Object.entries(summary.patternCounts)
      .map(([name, count]) => `- ${name}: ${count}`)
      .join('\n') || '- None';

    const topLeadLines = scored.slice(0, 10).map((lead, index) => {
      return `${index + 1}. **${lead.name}** — Score ${lead.score}/10  \n   Email: ${lead.email || 'N/A'}  \n   Days dormant: ${lead.daysSinceActivity ?? 'N/A'}  \n   Breakdown: Urgency ${lead.breakdown?.urgency ?? '-'} | Budget ${lead.breakdown?.budget ?? '-'} | Engagement ${lead.breakdown?.engagement ?? '-'} | Timeline ${lead.breakdown?.timeline ?? '-'}`;
    }).join('\n\n') || 'No leads scored.';

    const draftLines = drafts.slice(0, 10).map((draft, index) => {
      return `${index + 1}. **${draft.name || draft.contactId}**  \n   Pattern: ${draft.patternName || draft.pattern}  \n   Subject: ${draft.subject}`;
    }).join('\n\n') || 'No drafts generated.';

    return `# Pipeline Restoration Audit Report\n\n**Client:** ${clientName}  \n**Generated:** ${generatedAt}  \n\n---\n\n## Executive Summary\n\n- Dormant leads found: **${summary.dormantCount}**\n- Leads scored: **${summary.scoredCount}**\n- Drafts generated: **${summary.draftedCount}**\n- Highest restoration score: **${summary.topScore}/10**\n- Average score: **${summary.avgScore}/10**\n\n## Pattern Distribution\n\n${patternLines}\n\n---\n\n## Top Restoration Opportunities\n\n${topLeadLines}\n\n---\n\n## Drafted Messages Ready for Review\n\n${draftLines}\n\n---\n\n## Recommended Next Steps\n\n1. Review the top 5 scored leads first\n2. Approve or edit the drafted messages\n3. Send approved messages in a single batch\n4. Track replies over the next 48-72 hours\n5. Route warm replies into booking\n\n---\n\n## Strategic Note\n\nThese are not cold leads. These are previously engaged contacts who raised their hand, entered conversation, and then went dormant. The goal is not generic follow-up. The goal is thoughtful re-engagement that restores real opportunities already sitting in the CRM.\n`;
  }

  toHtml({ clientName = 'Client', generatedAt, summary, scored = [], drafts = [] }) {
    const patternItems = Object.entries(summary.patternCounts)
      .map(([name, count]) => `<li><strong>${name}:</strong> ${count}</li>`)
      .join('') || '<li>None</li>';

    const topLeadRows = scored.slice(0, 10).map((lead) => `
      <tr>
        <td>${lead.name}</td>
        <td>${lead.email || 'N/A'}</td>
        <td>${lead.score}/10</td>
        <td>${lead.daysSinceActivity ?? 'N/A'}</td>
        <td>U:${lead.breakdown?.urgency ?? '-'} B:${lead.breakdown?.budget ?? '-'} E:${lead.breakdown?.engagement ?? '-'} T:${lead.breakdown?.timeline ?? '-'}</td>
      </tr>`).join('');

    const draftRows = drafts.slice(0, 10).map((draft) => `
      <tr>
        <td>${draft.name || draft.contactId}</td>
        <td>${draft.patternName || draft.pattern}</td>
        <td>${draft.subject}</td>
      </tr>`).join('');

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pipeline Restoration Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #222; line-height: 1.5; padding: 24px; }
    h1, h2 { color: #111; }
    .card { background: #f7f7f9; border: 1px solid #e5e5ea; border-radius: 10px; padding: 16px; margin: 16px 0; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f0f0f0; }
    .metric { display: inline-block; margin-right: 18px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>Pipeline Restoration Audit Report</h1>
  <p><strong>Client:</strong> ${clientName}<br><strong>Generated:</strong> ${generatedAt}</p>

  <div class="card">
    <h2>Executive Summary</h2>
    <div class="metric"><strong>Dormant leads found:</strong> ${summary.dormantCount}</div>
    <div class="metric"><strong>Leads scored:</strong> ${summary.scoredCount}</div>
    <div class="metric"><strong>Drafts generated:</strong> ${summary.draftedCount}</div>
    <div class="metric"><strong>Highest score:</strong> ${summary.topScore}/10</div>
    <div class="metric"><strong>Average score:</strong> ${summary.avgScore}/10</div>
  </div>

  <div class="card">
    <h2>Pattern Distribution</h2>
    <ul>${patternItems}</ul>
  </div>

  <h2>Top Restoration Opportunities</h2>
  <table>
    <thead><tr><th>Name</th><th>Email</th><th>Score</th><th>Days Dormant</th><th>Breakdown</th></tr></thead>
    <tbody>${topLeadRows || '<tr><td colspan="5">No leads scored.</td></tr>'}</tbody>
  </table>

  <h2>Drafted Messages Ready for Review</h2>
  <table>
    <thead><tr><th>Contact</th><th>Pattern</th><th>Subject</th></tr></thead>
    <tbody>${draftRows || '<tr><td colspan="3">No drafts generated.</td></tr>'}</tbody>
  </table>

  <div class="card">
    <h2>Recommended Next Steps</h2>
    <ol>
      <li>Review the top 5 scored leads first</li>
      <li>Approve or edit the drafted messages</li>
      <li>Send approved messages in a single batch</li>
      <li>Track replies over the next 48-72 hours</li>
      <li>Route warm replies into booking</li>
    </ol>
  </div>
</body>
</html>`;
  }
}

module.exports = Reporter;
