/**
 * Client-side only export utilities.
 *
 * jsPDF / html2canvas are browser-safe as static imports.
 * docx + file-saver use dynamic imports so they are never evaluated
 * during SSR (where Node built-ins like `events` aren't polyfilled).
 */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export the document editor content as PDF.
 * @param {string} htmlContent - The innerHTML of the editor (HTML string)
 * @param {string} title - Document title used as filename
 */
export async function exportAsPDF(htmlContent, title) {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 794px;
    padding: 60px;
    background: #ffffff;
    color: #111111;
    font-family: Georgia, serif;
    font-size: 14px;
    line-height: 1.7;
    z-index: -1;
  `;
  container.innerHTML = htmlContent;
  window.document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${title || 'document'}.pdf`);
  } finally {
    window.document.body.removeChild(container);
  }
}

/**
 * Export the document editor content as DOCX.
 * Uses dynamic imports so docx (which depends on Node's `events`) is
 * never bundled into the SSR pass.
 * @param {string} htmlContent - The innerHTML of the editor
 * @param {string} title - Document title used as filename
 */
export async function exportAsDOCX(htmlContent, title) {
  // Dynamic imports — resolved only in the browser at call time
  const [{ Document, Packer, Paragraph, HeadingLevel }, { saveAs }] =
    await Promise.all([
      import('docx'),
      import('file-saver'),
    ]);

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const paragraphs = [];

  if (title) {
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
      })
    );
  }

  const body = doc.body;
  body.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) paragraphs.push(new Paragraph({ text }));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName.toLowerCase();
    const text = node.textContent.trim();
    if (!text) return;

    if (tag === 'h1') {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1 }));
    } else if (tag === 'h2') {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2 }));
    } else if (tag === 'h3') {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3 }));
    } else if (tag === 'ul' || tag === 'ol') {
      node.querySelectorAll('li').forEach((li) => {
        paragraphs.push(
          new Paragraph({ text: `• ${li.textContent.trim()}`, indent: { left: 360 } })
        );
      });
    } else if (tag === 'blockquote') {
      paragraphs.push(new Paragraph({ text: `"${text}"`, indent: { left: 720 } }));
    } else {
      paragraphs.push(new Paragraph({ text }));
    }
  });

  const docxFile = new Document({
    sections: [{ children: paragraphs }],
  });

  const buffer = await Packer.toBlob(docxFile);
  saveAs(buffer, `${title || 'document'}.docx`);
}
