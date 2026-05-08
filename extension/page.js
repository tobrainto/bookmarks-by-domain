// ─── Greeting & Date ────────────────────────────────────────────────────────
function updateGreeting() {
  const now = new Date();
  const hour = now.getHours();
  let greeting;

  if (hour < 6) greeting = 'Good night';
  else if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else if (hour < 21) greeting = 'Good evening';
  else greeting = 'Good night';

  const g = document.getElementById('greeting1');
  const d = document.getElementById('dateDisplay1');
  if (g) g.textContent = greeting;
  if (d) d.textContent = formatDate(now);
}

function formatDate(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// ─── State ───────────────────────────────────────────────────────────────────
let domainGroups = {};  // domain -> [{id, title, url, folder}]
let deleteMode = false;
let sortMode = 'count';

// ─── Load Bookmarks ─────────────────────────────────────────────────────────
function loadBookmarks() {
  chrome.bookmarks.getTree((tree) => {
    const entries = [];

    function walk(node, folderPath) {
      if (node.children) {
        const name = node.title || '';
        const currentPath = folderPath ? `${folderPath} › ${name}` : name;
        for (const child of node.children) {
          if (child.url) {
            entries.push({
              id: child.id,
              title: child.title || '(no title)',
              url: child.url,
              folder: currentPath,
            });
          } else {
            walk(child, currentPath);
          }
        }
      }
    }

    for (const root of tree) {
      if (root.children) {
        for (const child of root.children) {
          walk(child, root.title);
        }
      }
    }

    domainGroups = groupByDomain(entries);
    render(domainGroups);
  });
}

function groupByDomain(entries) {
  const map = {};
  for (const entry of entries) {
    try {
      const url = new URL(entry.url);
      const domain = url.hostname || 'unknown';
      if (!map[domain]) map[domain] = [];
      map[domain].push(entry);
    } catch {
      if (!map['invalid']) map['invalid'] = [];
      map['invalid'].push(entry);
    }
  }
  return Object.fromEntries(
    Object.entries(map).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
  );
}

// ─── Render ──────────────────────────────────────────────────────────────────
function render(groups) {
  const container = document.getElementById('domainColumns');
  const loading = document.getElementById('loading');
  if (loading) loading.remove();

  let totalBookmarks = 0;
  const fragments = [];

  for (const [domain, entries] of Object.entries(groups)) {
    totalBookmarks += entries.length;

    const escapedDomain = esc(domain);
    const entryHTML = entries.map(entry => {
      const faviconUrl = getFaviconUrl(entry.url);
      const searchable = `${entry.title} ${entry.url} ${entry.folder} ${domain}`.toLowerCase();
      return `
      <li data-id="${esc(entry.id)}" data-search="${esc(searchable)}">
        <img class="favicon" src="${faviconUrl}" alt="" loading="lazy">
        <a href="${esc(entry.url)}" target="_blank" title="${esc(entry.url)}">${esc(entry.title)}</a>
        <span class="folder-tag">${esc(entry.folder)}</span>
        <button class="delete-btn" data-id="${esc(entry.id)}" title="Delete this bookmark">&times;</button>
      </li>`;
    }).join('');

    fragments.push(`
  <div class="domain-group" data-domain="${escapedDomain.toLowerCase()}">
    <details open>
      <summary>
        <span class="domain-left">
          <span class="domain-name" title="${escapedDomain}">${escapedDomain}</span>
        </span>
        <span class="domain-right">
          <span class="domain-count" data-count="${entries.length}">${entries.length}</span>
          <button class="delete-domain-btn" data-domain="${escapedDomain}" title="Delete all bookmarks for this domain">&times;</button>
        </span>
      </summary>
      <ul class="bookmark-list">${entryHTML}
      </ul>
    </details>
  </div>`);
  }

  container.innerHTML = fragments.join('\n');
  updateStats(totalBookmarks, Object.keys(groups).length);

  // Favicon fallback: replace broken images with globe icon
  container.querySelectorAll('.favicon').forEach(img => {
    img.addEventListener('error', () => {
      img.src = faviconFallback();
    }, { once: true });
  });
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function getFaviconUrl(url) {
  try {
    const parsed = new URL(url);
    return `https://${parsed.hostname}/favicon.ico`;
  } catch {
    return '';
  }
}

function faviconFallback() {
  return faviconFallback.svg || (faviconFallback.svg = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#87867f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>'));
}

function updateStats(bookmarks, domains) {
  const bm = bookmarks === 1 ? 'bookmark' : 'bookmarks';
  const dm = domains === 1 ? 'domain' : 'domains';
  const text = `${bookmarks} ${bm} of ${domains} ${dm}`;
  const hc = document.getElementById('headerCount');
  const fc = document.getElementById('footerCount');
  if (hc) hc.textContent = text;
  if (fc) fc.textContent = text;

  // Sync "Delete all" button count
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  if (deleteAllBtn && getComputedStyle(deleteAllBtn).display !== 'none') {
    const btnText = bookmarks === 1 ? 'bookmark' : 'bookmarks';
    deleteAllBtn.innerHTML = `<span class="delete-all-icon">&times;</span> Delete all ${bookmarks} ${btnText}`;
  }
}

// ─── Close Sound ─────────────────────────────────────────────────────────────
function playCloseSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const duration = 0.25;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const pos = i / data.length;
      const env = pos < 0.1 ? pos / 0.1 : Math.pow(1 - (pos - 0.1) / 0.9, 1.5);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2.0;
    filter.frequency.setValueAtTime(4000, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(t);

    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not supported — fail silently
  }
}

// ─── Confetti ────────────────────────────────────────────────────────────────
function shootConfetti(x, y) {
  const colors = [
    '#c96442', // terracotta
    '#d97757', // coral
    '#c8713a', // amber
    '#8aaa92', // sage light
    '#5a6b7a', // slate
    '#d4b896', // warm paper
    '#b35a5a', // rose
    '#5e5d59', // olive gray
  ];

  const particleCount = 17;

  for (let i = 0; i < particleCount; i++) {
    const el = document.createElement('div');

    const isCircle = Math.random() > 0.5;
    const size = 5 + Math.random() * 6; // 5–11px
    const color = colors[Math.floor(Math.random() * colors.length)];

    el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${isCircle ? '50%' : '2px'};
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      opacity: 1;
    `;
    document.body.appendChild(el);

    const angle   = Math.random() * Math.PI * 2;
    const speed   = 60 + Math.random() * 120;
    const vx      = Math.cos(angle) * speed;
    const vy      = Math.sin(angle) * speed - 80; // bias upward
    const gravity = 200;

    const startTime = performance.now();
    const duration  = 700 + Math.random() * 200; // 700–900ms

    function frame(now) {
      const elapsed  = (now - startTime) / 1000;
      const progress = elapsed / (duration / 1000);

      if (progress >= 1) { el.remove(); return; }

      const px = vx * elapsed;
      const py = vy * elapsed + 0.5 * gravity * elapsed * elapsed;
      const opacity = progress < 0.5 ? 1 : 1 - (progress - 0.5) * 2;
      const rotate  = elapsed * 200 * (isCircle ? 0 : 1);

      el.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) rotate(${rotate}deg)`;
      el.style.opacity = opacity;

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }
}

// ─── Animate bookmark out ───────────────────────────────────────────────────
function animateBookmarkOut(element) {
  const rect = element.getBoundingClientRect();
  shootConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);

  element.style.transition = 'opacity 0.3s, transform 0.3s';
  element.style.opacity = '0';
  element.style.transform = 'scale(0.95)';

  setTimeout(() => { element.remove(); }, 300);
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────
let confirmResolve = null;

function showConfirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('confirmOverlay');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const cancelBtn = document.getElementById('confirmCancel');
    const deleteBtn = document.getElementById('confirmDelete');

    titleEl.textContent = title;
    msgEl.innerHTML = message;
    overlay.classList.remove('hidden');

    // Trigger animation
    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    confirmResolve = resolve;
  });
}

function closeConfirm(result) {
  const overlay = document.getElementById('confirmOverlay');
  overlay.classList.remove('visible');
  setTimeout(() => {
    overlay.classList.add('hidden');
    if (confirmResolve) {
      confirmResolve(result);
      confirmResolve = null;
    }
  }, 200);
}

document.addEventListener('click', e => {
  if (e.target.id === 'confirmCancel') {
    closeConfirm(false);
  } else if (e.target.id === 'confirmDelete') {
    closeConfirm(true);
  } else if (e.target.id === 'confirmOverlay') {
    closeConfirm(false);
  }
});

document.addEventListener('keydown', e => {
  const overlay = document.getElementById('confirmOverlay');
  if (overlay.classList.contains('hidden')) return;
  if (e.key === 'Escape') closeConfirm(false);
  if (e.key === 'Enter') closeConfirm(true);
});

// ─── Delete: Single Bookmark ────────────────────────────────────────────────
function deleteBookmark(bookmarkId, element) {
  const li = element.closest('li');
  chrome.bookmarks.remove(bookmarkId, () => {
    if (chrome.runtime.lastError) {
      alert(`Delete failed: ${chrome.runtime.lastError.message}`);
      return;
    }
    playCloseSound();
    animateBookmarkOut(li);
    updateCounts(-1, 0);
    const group = li.closest('.domain-group');
    if (group && group.querySelectorAll('.bookmark-list li').length === 0) {
      setTimeout(() => {
        if (group.querySelectorAll('.bookmark-list li').length === 0) {
          group.remove();
          updateCounts(0, -1);
        }
      }, 310);
    }
  });
}

// ─── Delete: Entire Domain ──────────────────────────────────────────────────
function deleteDomain(domain, element) {
  const group = element.closest('.domain-group');
  const ids = Array.from(group.querySelectorAll('.delete-btn')).map(b => b.dataset.id);
  const count = ids.length;

  // Fire confetti at the group center
  const rect = group.getBoundingClientRect();
  shootConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);

  group.style.transition = 'opacity 0.35s, transform 0.35s';
  group.style.opacity = '0';
  group.style.transform = 'scale(0.97)';

  playCloseSound();

  for (const id of ids) {
    chrome.bookmarks.remove(id, () => {
      // deletion happens in background
    });
  }

  setTimeout(() => {
    group.remove();
    updateCounts(-count, -1);
  }, 350);
}

function updateCounts(bm, dm) {
  const footerCount = document.getElementById('footerCount');
  if (!footerCount) return;
  const parts = footerCount.textContent.match(/(\d+)/g);
  const currentBm = parts ? parseInt(parts[0]) : 0;
  const currentDm = parts ? parseInt(parts[1]) : 0;
  const newBm = Math.max(0, currentBm + bm);
  const newDm = Math.max(0, currentDm + dm);
  updateStats(newBm, newDm);
}

// ─── Re-render after changes ────────────────────────────────────────────────
function reRender() {
  render(domainGroups);
}

// ─── Scroll-to-top ──────────────────────────────────────────────────────────
function initScrollToTop() {
  const btn = document.getElementById('scroll-top');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        btn.classList.toggle('visible', window.scrollY > 400);
        ticking = false;
      });
      ticking = true;
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ─── Event Listeners ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateGreeting();
  loadBookmarks();
  initScrollToTop();

  function reApplySearch(query) {
    let visibleCount = 0;
    let visibleBookmarks = 0;
    let visibleDomains = 0;

    document.querySelectorAll('.domain-group').forEach(group => {
      if (!query) {
        group.querySelectorAll('.bookmark-list li').forEach(li => li.style.display = '');
        group.style.display = '';
        const domainCount = group.querySelector('.domain-count');
        if (domainCount) domainCount.textContent = domainCount.dataset.count;
        visibleDomains++;
        visibleBookmarks += group.querySelectorAll('.bookmark-list li').length;
        visibleCount++;
        return;
      }

      const q = query.toLowerCase();
      let matchCount = 0;
      group.querySelectorAll('.bookmark-list li').forEach(li => {
        const searchable = li.dataset.search || '';
        const matches = searchable.includes(q);
        li.style.display = matches ? '' : 'none';
        if (matches) matchCount++;
      });

      if (matchCount > 0) {
        group.style.display = '';
        visibleDomains++;
        visibleBookmarks += matchCount;
        visibleCount++;
        const domainCount = group.querySelector('.domain-count');
        if (domainCount) domainCount.textContent = `${matchCount}`;
      } else {
        group.style.display = 'none';
      }
    });

    if (query) {
      updateStats(visibleBookmarks, visibleDomains);
    } else {
      const totalBm = Object.values(domainGroups).reduce((s, e) => s + e.length, 0);
      const totalDm = Object.keys(domainGroups).length;
      updateStats(totalBm, totalDm);
    }

    // Show "Delete all" button only when searching + delete mode
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
      const show = query && deleteMode && visibleBookmarks > 1;
      deleteAllBtn.style.display = show ? 'inline-flex' : 'none';
      if (show) deleteAllBtn.innerHTML = `<span class="delete-all-icon">&times;</span> Delete all ${visibleBookmarks} bookmarks`;
    }
    document.getElementById('no-results').classList.toggle('hidden', visibleCount > 0);

    // Store visible count for delete all
    reApplySearch._visibleBookmarks = visibleBookmarks;
    reApplySearch._query = query;
  }

  // Delete mode toggle
  document.getElementById('delete-toggle').addEventListener('click', function() {
    deleteMode = !deleteMode;
    this.classList.toggle('active', deleteMode);
    this.textContent = deleteMode ? 'Delete Mode: ON' : 'Delete Mode';
    document.body.classList.toggle('delete-mode', deleteMode);

    // Toggle "Delete all" button visibility
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
      const hasQuery = document.getElementById('search').value.trim();
      const count = reApplySearch._visibleBookmarks || 0;
      const show = hasQuery && deleteMode && count > 1;
      deleteAllBtn.style.display = show ? 'inline-flex' : 'none';
      if (show) deleteAllBtn.innerHTML = `<span class="delete-all-icon">&times;</span> Delete all ${count} bookmarks`;
    }
  });

  // Delete all visible bookmarks
  document.getElementById('deleteAllBtn').addEventListener('click', async () => {
    const count = reApplySearch._visibleBookmarks || 0;
    const ok = await showConfirm('Delete all', `Remove all <strong>${count}</strong> matching bookmarks?`);
    if (!ok) return;

    const ids = [];
    document.querySelectorAll('.domain-group').forEach(group => {
      if (group.style.display !== 'none') {
        group.querySelectorAll('.delete-btn').forEach(btn => {
          // Only collect IDs from visible (matching) bookmarks
          const li = btn.closest('li');
          if (li.style.display !== 'none') {
            ids.push(btn.dataset.id);
          }
        });
      }
    });

    for (const id of ids) {
      chrome.bookmarks.remove(id, () => {});
    }

    // Animate removal — only matching groups
    document.querySelectorAll('.domain-group').forEach(group => {
      if (group.style.display !== 'none') {
        const rect = group.getBoundingClientRect();
        shootConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        group.style.transition = 'opacity 0.35s, transform 0.35s';
        group.style.opacity = '0';
        group.style.transform = 'scale(0.97)';
      }
    });

    playCloseSound();

    setTimeout(() => {
      const searchQuery = document.getElementById('search').value.trim();
      loadBookmarks();
      if (searchQuery) {
        setTimeout(() => reApplySearch(searchQuery), 100);
      }
    }, 350);
  });

  // Expand / Collapse
  document.getElementById('expand-all').addEventListener('click', () => {
    document.querySelectorAll('.domain-group').forEach(g => {
      if (g.style.display !== 'none') g.querySelectorAll('details').forEach(d => d.open = true);
    });
  });

  document.getElementById('collapse-all').addEventListener('click', () => {
    document.querySelectorAll('.domain-group').forEach(g => {
      if (g.style.display !== 'none') g.querySelectorAll('details').forEach(d => d.open = false);
    });
  });

  // Sort — set default active state
  document.getElementById('sort-count').classList.add('active');

  document.getElementById('sort-alpha').addEventListener('click', () => {
    sortMode = 'alpha';
    document.getElementById('sort-alpha').classList.add('active');
    document.getElementById('sort-count').classList.remove('active');
    domainGroups = Object.fromEntries(
      Object.entries(domainGroups).sort((a, b) => a[0].localeCompare(b[0]))
    );
    reRender();
    reApplySearch(document.getElementById('search').value.toLowerCase().trim());
  });

  document.getElementById('sort-count').addEventListener('click', () => {
    sortMode = 'count';
    document.getElementById('sort-count').classList.add('active');
    document.getElementById('sort-alpha').classList.remove('active');
    domainGroups = Object.fromEntries(
      Object.entries(domainGroups).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    );
    reRender();
    reApplySearch(document.getElementById('search').value.toLowerCase().trim());
  });

  // Search
  document.getElementById('search').addEventListener('input', function() {
    reApplySearch(this.value.toLowerCase().trim());
  });

  // Delete buttons (event delegation)
  document.getElementById('domainColumns').addEventListener('click', async e => {
    if (!deleteMode) return;

    const delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
      e.stopPropagation();
      const ok = await showConfirm('Delete bookmark', 'Remove this bookmark?');
      if (ok) deleteBookmark(delBtn.dataset.id, delBtn);
      return;
    }

    const delDomainBtn = e.target.closest('.delete-domain-btn');
    if (delDomainBtn) {
      e.stopPropagation();
      const domain = delDomainBtn.dataset.domain;
      const group = delDomainBtn.closest('.domain-group');
      const count = group.querySelectorAll('.bookmark-list li').length;
      const ok = await showConfirm(
        'Delete domain',
        `Remove all <strong>${count}</strong> bookmarks under <strong>${esc(domain)}</strong>?`
      );
      if (ok) deleteDomain(domain, delDomainBtn);
      return;
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      document.getElementById('search').focus();
    }
    if (e.key === 'Escape') {
      if (deleteMode) {
        document.getElementById('delete-toggle').click();
      }
      const search = document.getElementById('search');
      search.blur();
      search.value = '';
      search.dispatchEvent(new Event('input'));
    }
  });
});
