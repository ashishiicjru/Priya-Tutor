/* Shared engine for Priya + Last Mile Tutor: AI client (talks to /api/ai only), language, voice, storage, share codes. */
(() => {
  const K = 'lmt-suite', API = (window.LMT_API || '') + '/api/ai';
  const LANGS = { English: 'en-IN', Hindi: 'hi-IN', Bengali: 'bn-IN', Tamil: 'ta-IN', Telugu: 'te-IN', Marathi: 'mr-IN', Gujarati: 'gu-IN', Kannada: 'kn-IN' };
  const st = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch (e) { return {}; } };
  const set = o => { try { localStorage.setItem(K, JSON.stringify({ ...st(), ...o })); } catch (e) {} };
  const lang = () => st().lang || 'English';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const enc = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = s => { try { return JSON.parse(decodeURIComponent(escape(atob(String(s).trim().replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { return null; } };
  async function ai(prompt, o = {}) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), 45000);
    try {
      const r = await fetch(API, { method: 'POST', signal: c.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, system: o.system || '', json: !!o.json, lang: o.lang || lang() }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.error) throw new Error(d.error || 'HTTP ' + r.status);
      if (!o.json) return d.text;
      const m = d.text.match(/[\[{][\s\S]*[\]}]/);
      return JSON.parse(m ? m[0] : d.text);
    } finally { clearTimeout(t); }
  }
  function speak(text, l) {
    if (!window.speechSynthesis || !text) return;
    speechSynthesis.cancel();
    const code = LANGS[l || lang()] || 'en-IN', u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]*>/g, ' ').replace(/[*#`_]/g, ' ').slice(0, 900));
    u.lang = code; u.rate = .95;
    const vs = speechSynthesis.getVoices(), v = vs.find(x => x.lang === code) || vs.find(x => x.lang.startsWith(code.slice(0, 2)));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  function listen(cb, l) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Voice input works in Chrome or Edge'); return null; }
    const r = new SR(); r.lang = LANGS[l || lang()] || 'en-IN';
    r.onresult = e => cb(e.results[0][0].transcript);
    r.onerror = () => toast('Could not hear you, try again');
    r.start(); return r;
  }
  function toast(m) {
    let t = document.getElementById('lmt-toast');
    if (!t) { t = document.createElement('div'); t.id = 'lmt-toast'; t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 16px;border-radius:12px;font:14px system-ui;z-index:99999;max-width:90vw;box-shadow:0 6px 24px rgba(0,0,0,.4)'; document.body.appendChild(t); }
    t.textContent = m; t.style.display = 'block'; clearTimeout(t._t); t._t = setTimeout(() => t.style.display = 'none', 3200);
  }
  const copy = s => (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(() => toast('Copied'), () => prompt('Copy this:', s));
  const url = (page, hash) => new URL(page, location.href).href + (hash || '');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  window.LMT = { LANGS, st, set, lang, esc, enc, dec, ai, speak, listen, toast, copy, url };
})();
