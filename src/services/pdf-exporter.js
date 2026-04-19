const PDFDocument = require('pdfkit');
const fs = require('fs');

class PdfExporter {
  export({ clientName, generatedAt, summary, scored = [], drafts = [], outPath }) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      doc.fontSize(22).text('Pipeline Restoration Audit Report');
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Client: ${clientName}`);
      doc.text(`Generated: ${generatedAt}`);
      doc.moveDown();

      doc.fontSize(16).text('Executive Summary');
      doc.fontSize(11)
        .text(`Dormant leads found: ${summary.dormantCount}`)
        .text(`Leads scored: ${summary.scoredCount}`)
        .text(`Drafts generated: ${summary.draftedCount}`)
        .text(`Highest score: ${summary.topScore}/10`)
        .text(`Average score: ${summary.avgScore}/10`);

      doc.moveDown();
      doc.fontSize(16).text('Top Restoration Opportunities');
      scored.slice(0, 10).forEach((lead, i) => {
        doc.moveDown(0.5);
        doc.fontSize(12).text(`${i + 1}. ${lead.name} — Score ${lead.score}/10`, { underline: false });
        doc.fontSize(10)
          .text(`Email: ${lead.email || 'N/A'}`)
          .text(`Days dormant: ${lead.daysSinceActivity ?? 'N/A'}`)
          .text(`Breakdown: U ${lead.breakdown?.urgency ?? '-'} | B ${lead.breakdown?.budget ?? '-'} | E ${lead.breakdown?.engagement ?? '-'} | T ${lead.breakdown?.timeline ?? '-'}`);
      });

      doc.addPage();
      doc.fontSize(16).text('Drafted Messages Ready for Review');
      drafts.slice(0, 10).forEach((draft, i) => {
        doc.moveDown(0.5);
        doc.fontSize(12).text(`${i + 1}. ${draft.name}`);
        doc.fontSize(10)
          .text(`Pattern: ${draft.patternName || draft.pattern}`)
          .text(`Subject: ${draft.subject}`);
      });

      doc.moveDown();
      doc.fontSize(16).text('Recommended Next Steps');
      ['Review the top 5 scored leads first','Approve or edit the drafted messages','Send approved messages in a single batch','Track replies over the next 48-72 hours','Route warm replies into booking'].forEach((step, i) => doc.fontSize(11).text(`${i + 1}. ${step}`));

      doc.end();
      stream.on('finish', () => resolve(outPath));
      stream.on('error', reject);
    });
  }
}

module.exports = PdfExporter;
