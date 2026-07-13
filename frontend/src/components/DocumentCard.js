import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { timeAgo, formatFileSize, getFileIcon, SUBJECT_LABELS } from '../utils/helpers';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DocumentPreview from './DocumentPreview';

const DocumentCard = ({ doc, showDownload = true }) => {
  const { currentUser } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  /* ── Detect file type ─────────────────────────────────────────── */
  const getType = (url = '', fallback = '') => {
    const clean = url.split('?')[0].toLowerCase();
    if (clean.endsWith('.pdf'))               return 'pdf';
    if (clean.endsWith('.docx') || clean.endsWith('.doc'))  return 'docx';
    if (clean.endsWith('.xlsx') || clean.endsWith('.xls'))  return 'xlsx';
    if (clean.endsWith('.pptx') || clean.endsWith('.ppt'))  return 'pptx';
    const ft = fallback.toLowerCase();
    if (ft.includes('pdf'))          return 'pdf';
    if (ft.includes('word')  || ft.includes('docx')) return 'docx';
    if (ft.includes('sheet') || ft.includes('xlsx')) return 'xlsx';
    if (ft.includes('pres')  || ft.includes('pptx')) return 'pptx';
    return '';
  };

  const rawUrl      = doc.fileUrl || doc.fileURL || doc.file_url || '';
  const fileType    = getType(rawUrl, doc.fileType || '');

  /* ── Download ─────────────────────────────────────────────────── */
  const handleDownload = async () => {
  if (!rawUrl) return alert("File not available");

  try {
    await api.patch(`/documents/${doc.id}/download`);
  } catch (err) {
    console.error("Download API Error:", err.response?.data || err.message);
  }

  const dlUrl = rawUrl.replace(
    /\/(image|raw|video)\/upload\//,
    "/$1/upload/fl_attachment/"
  );

  window.open(dlUrl || rawUrl, "_blank");
};
  /* ── Delete ───────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    }
  };

  /* ── AI Summary ───────────────────────────────────────────────── */
  const handleSummarize = async () => {
    setShowSummary(true);
    if (summary) return; // already fetched, just reopen the modal

    setSummaryLoading(true);
    setSummaryError('');
    try {
      const { data } = await api.post(`/documents/${doc.id}/summary`);
      setSummary(data.summary);
    } catch (err) {
      setSummaryError(err.response?.data?.error || 'Failed to generate summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const summaryModal = showSummary ? ReactDOM.createPortal(
    <div
      onClick={() => setShowSummary(false)}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '12px',
          padding: '24px', width: '88%', maxWidth: '560px',
          maxHeight: '80vh', overflowY: 'auto', position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>🤖 AI Summary</h3>
          <button
            onClick={() => setShowSummary(false)}
            style={{
              background: '#555', color: '#fff', border: 'none',
              borderRadius: '5px', padding: '6px 14px',
              cursor: 'pointer', fontSize: '15px',
            }}
          >✕ Close</button>
        </div>

        {summaryLoading && <p>Generating summary with Gemini... this can take a few seconds.</p>}
        {summaryError && <p style={{ color: 'red' }}>{summaryError}</p>}
        {summary && (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '14.5px' }}>
            {summary}
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  /* ── Preview modal (portal) ───────────────────────────────────── */
  const previewModal = showPreview ? ReactDOM.createPortal(
    <div
      onClick={() => setShowPreview(false)}
      style={{
        position:'fixed', inset:0,
        background:'rgba(0,0,0,0.78)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex: 9999,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'#fff', borderRadius:'12px',
          padding:'24px', width:'88%', maxWidth:'920px',
          maxHeight:'90vh', overflowY:'auto', position:'relative',
        }}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <h3 style={{ margin:0 }}>{doc.title}</h3>
          <button
            onClick={() => setShowPreview(false)}
            style={{
              background:'#555', color:'#fff', border:'none',
              borderRadius:'5px', padding:'6px 14px',
              cursor:'pointer', fontSize:'15px',
            }}
          >✕ Close</button>
        </div>
        <DocumentPreview fileUrl={rawUrl} fileType={fileType} />
      </div>
    </div>,
    document.body
  ) : null;

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="document-card">
      <div className="document-preview">
        <span className="file-type">{doc.fileType || fileType.toUpperCase() || 'FILE'}</span>
      </div>

      <h3>{doc.title}</h3>
      <p>{doc.description || 'No description provided.'}</p>

      <div className="document-meta">
        <span>Sem {doc.semester}</span>
        <span>{SUBJECT_LABELS[doc.subject] || doc.subject}</span>
      </div>

      <div className="document-stats">
        <span>👁 {doc.viewCount || 0} views</span>
        <span>⬇ {doc.downloadCount || 0} downloads</span>
      </div>

      <div className="document-meta">
        <span>{getFileIcon(doc.fileType)} {formatFileSize(doc.fileSize)}</span>
        <span>{timeAgo(doc.createdAt)}</span>
      </div>

      <small style={{ color: 'var(--medium-gray)' }}>
        By {doc.uploaderName}
      </small>

      {/* ── Buttons ── */}
      <div style={{ display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap' }}>

        {/* Preview */}
        <button
          onClick={async () => {
  try {
    await api.patch(`/documents/${doc.id}/view`);
  } catch (err) {
    console.error("View API Error:", err.response?.data || err.message);
  }

  setShowPreview(true);
}}
          style={{
            background:'#4A90E2', color:'#fff',
            padding:'6px 12px', border:'none',
            borderRadius:'5px', cursor:'pointer',
          }}
        >
          👁 Preview
        </button>

        {/* Download */}
        {showDownload && (
          <button className="download-btn" onClick={handleDownload}>
            ⬇ Download
          </button>
        )}

        {/* AI Summary */}
        <button
          onClick={handleSummarize}
          style={{
            background:'#8e44ad', color:'#fff',
            padding:'6px 12px', border:'none',
            borderRadius:'5px', cursor:'pointer',
          }}
        >
          🤖 AI Summary
        </button>

        {/* Delete (owner only) */}
        {currentUser && doc.uploaderId === currentUser.uid && (
          <button
            onClick={handleDelete}
            style={{
              marginTop:'0', background:'red', color:'#fff',
              padding:'6px 12px', border:'none',
              borderRadius:'5px', cursor:'pointer',
            }}
          >
            🗑 Delete
          </button>
        )}
      </div>

      {/* Portals */}
      {previewModal}
      {summaryModal}
    </div>
  );
};

export default DocumentCard;