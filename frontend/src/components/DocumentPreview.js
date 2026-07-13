import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import mammoth from "mammoth";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// ✅ FIX: Use .js not .mjs — the .mjs build is not on cdnjs for newer versions
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentPreview = ({ fileUrl, fileType }) => {
  const [numPages,    setNumPages]    = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [docxHtml,    setDocxHtml]    = useState('');
  const [docxLoading, setDocxLoading] = useState(false);
  const [pdfError,    setPdfError]    = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setNumPages(null);
    setPdfError(false);
  }, [fileUrl]);

  useEffect(() => {
    if (fileType !== 'docx' || !fileUrl) return;
    setDocxLoading(true);
    fetch(fileUrl)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
      .then(buf => mammoth.convertToHtml({ arrayBuffer: buf }))
      .then(res => setDocxHtml(res.value))
      .catch(() => setDocxHtml('<p>Could not load document.</p>'))
      .finally(() => setDocxLoading(false));
  }, [fileUrl, fileType]);

  if (!fileUrl) return <p>No file URL provided.</p>;

  /* PDF */
  if (fileType === 'pdf') {
    // Always use iframe — avoids all worker/CORS issues, works perfectly for preview
    return (
      <iframe
        src={fileUrl}
        width="100%"
        height="600px"
        style={{ border: 'none', borderRadius: '8px' }}
        title="PDF Preview"
      />
    );
  }

  /* DOCX */
  if (fileType === 'docx') {
    if (docxLoading) return <p style={{ textAlign: 'center' }}>Loading document…</p>;
    return (
      <div style={{ padding: '12px', border: '1px solid #eee', borderRadius: '8px', lineHeight: '1.6' }}
        dangerouslySetInnerHTML={{ __html: docxHtml }} />
    );
  }

  /* Excel / PowerPoint */
  if (['xlsx', 'xls', 'ppt', 'pptx'].includes(fileType)) {
    return (
      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`}
        width="100%" height="550px"
        style={{ border: 'none', borderRadius: '8px' }} title="Document Preview" />
    );
  }

  return (
    <p style={{ color: 'gray', textAlign: 'center' }}>
      Preview not available for this file type: <b>{fileType || 'unknown'}</b>
    </p>
  );
};

export default DocumentPreview;