const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, startIndex, itemsPerPage, onItemsPerPageChange }) => {
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (totalPages > 1) pages.push(2);
    if (currentPage > 4) pages.push('...');
    for (let i = Math.max(3, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 3) pages.push('...');
    if (totalPages > 2) pages.push(totalPages);
    return [...new Set(pages)];
  };

  const btn = {
    padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
    background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
  };
  const activeBtn = { ...btn, background: '#16a34a', color: '#fff', borderColor: '#16a34a', fontWeight: 700 };
  const disabledBtn = { ...btn, opacity: 0.4, cursor: 'not-allowed', background: '#f8fafc' };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 12, marginTop: 20, padding: '14px 20px',
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10 }}>

      {/* Info + per-page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
        <span>Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}</span>
        <select value={itemsPerPage} onChange={e => onItemsPerPageChange(Number(e.target.value))}
          style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 7,
            fontSize: 13, color: '#374151', cursor: 'pointer' }}>
          {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={currentPage === 1 ? disabledBtn : btn}
          onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          ‹ Prev
        </button>

        {getPages().map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} style={{ padding: '0 6px', color: '#9ca3af' }}>...</span>
            : <button key={p}
                style={currentPage === p ? activeBtn : btn}
                onClick={() => onPageChange(p)}>{p}</button>
        )}

        <button style={currentPage === totalPages ? disabledBtn : btn}
          onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next ›
        </button>
        <button style={currentPage === totalPages ? disabledBtn : btn}
          onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
          Last »
        </button>
      </div>
    </div>
  );
};

export default Pagination;
