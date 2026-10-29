import { useEffect, useState } from 'react';
import { useT } from '../lib/i18n.jsx';

export const PAGE = 10;
// Paginate a list when it has more than 10 items: const [items, pager] = usePaged(list);
export function usePaged(list, size = PAGE, resetKey = '', focusIndex = -1) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(list.length / size));
  useEffect(() => { setPage(0); }, [resetKey]);
  useEffect(() => { if (focusIndex >= 0) setPage(Math.floor(focusIndex / size)); }, [focusIndex, size]); // show the page holding a linked item
  useEffect(() => { if (page > pages - 1) setPage(pages - 1); }, [pages, page]);
  const items = list.length > size ? list.slice(page * size, page * size + size) : list;
  const pager = list.length > size ? <Pager page={page} pages={pages} total={list.length} size={size} onPage={setPage} /> : null;
  return [items, pager];
}

export default function Pager({ page, pages, total, size, onPage }) {
  const { u } = useT();
  const from = page * size + 1, to = Math.min(total, from + size - 1);
  // compact page list: 1 … 4 5 6 … 12
  const nums = [];
  for (let i = 0; i < pages; i++) if (i === 0 || i === pages - 1 || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
  return (
    <nav className="pager" aria-label={u('pages')}>
      <span className="pg-info">{from}–{to} / {total}</span>
      <div className="pg-btns">
        <button type="button" className="pg" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label={u('prevPage')}>‹</button>
        {nums.map((n, i) => (n === '…'
          ? <span key={`e${i}`} className="pg-gap" aria-hidden="true">…</span>
          : <button type="button" key={n} className="pg" aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}>{n + 1}</button>))}
        <button type="button" className="pg" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label={u('nextPage')}>›</button>
      </div>
    </nav>
  );
}
