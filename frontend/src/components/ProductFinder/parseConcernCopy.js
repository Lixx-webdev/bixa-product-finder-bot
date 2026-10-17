// Parses the pre-approved, plain-text concern/sub-concern copy (paragraphs separated by \n\n)
// into typed blocks the design's two detail screens render differently:
//  - ConcernDetail shows: lead-in + bolded recommended product name, the "Best for:" list, and
//    the closing doctor-consultation note.
//  - ConcernKnowMore shows: the explanatory intro paragraph(s), the "<Herb> may help:" bullet
//    list, the doctor-consultation note, and the medical disclaimer.
export const parseConcernCopy = (text) => {
  if (!text) return [];

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const blocks = [];

  paragraphs.forEach((paragraph) => {
    const recommendMatch = paragraph.match(/^(.*?we recommend)\s+([^\n.]+)\.?\s*$/i);
    if (recommendMatch) {
      blocks.push({ type: 'lead-product', lead: recommendMatch[1].trim(), product: recommendMatch[2].trim() });
      return;
    }

    const bestForMatch = paragraph.match(/^Best for:\s*(.+)$/is);
    if (bestForMatch) {
      const items = bestForMatch[1].split(/,\s*/).map((s) => s.replace(/\.$/, '').trim()).filter(Boolean);
      blocks.push({ type: 'best-for', items });
      return;
    }

    const mayHelpMatch = paragraph.match(/may help:?\s*$/i);
    if (mayHelpMatch && paragraph.length < 80) {
      blocks.push({ type: 'may-help-heading', heading: paragraph.replace(/^🌿\s*/, '') });
      return;
    }

    const checklistLines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean);
    if (checklistLines.length > 1 && checklistLines.every((l) => l.startsWith('✅'))) {
      blocks.push({ type: 'checklist', items: checklistLines.map((l) => l.replace(/^✅\s*/, '')) });
      return;
    }

    if (/^This information is for educational purposes/i.test(paragraph)) {
      blocks.push({ type: 'disclaimer', text: paragraph });
      return;
    }

    if (paragraph.startsWith('🌿')) {
      blocks.push({ type: 'doctor-note', text: paragraph.replace(/^🌿\s*/, '') });
      return;
    }

    if (/^Know More$/i.test(paragraph)) return;

    blocks.push({ type: 'text', text: paragraph });
  });

  return blocks;
};

export default parseConcernCopy;
