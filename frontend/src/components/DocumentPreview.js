import React, { useState, useEffect } from "react";
import mammoth from "mammoth";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const DocumentPreview = ({ fileUrl, fileType }) => {
  const [docxHtml,    setDocxHtml]    = useState('');
  const [docxLoading, setDocxLoading] = useState(false);

  useEffect(() => {
    if (fileType !== 'docx' || !fileUrl) return;

    let cancelled = false;
    setDocxLoading(true);

    fetch(fileUrl)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
      .then(buf => mammoth.convertToHtml({ arrayBuffer: buf }))
      .then(res => { if (!cancelled) setDocxHtml(res.value); })
      .catch(() => { if (!cancelled) setDocxHtml('<p>Could not load document.</p>'); })
      .finally(() => { if (!cancelled) setDocxLoading(false); });

    return () => { cancelled = true; };
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