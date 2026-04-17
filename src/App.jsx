import React, { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import './styles.css'
import InputBox from './InputBox'
import SidebarPanel from './SidebarPanel'
import { observeAuth, saveConversation } from './firebase'

const API_KEY = "sk_1icxn6w9_lIPGJWDoN59NECDJ9UJT6Kma"
const API_URL = "https://api.sarvam.ai/v1/chat/completions"
const LOGO = "Dazzlone.png"

export default function App() {
  const msgsRef = useRef(null)
  const inputRef = useRef(null)
  const [mode, setModeState] = useState('normal')
  const [powerLevel, setPowerLevel] = useState(3)
  const [userSegment, setUserSegment] = useState('Individual')
  const [history, setHistory] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [firstMsg, setFirstMsg] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    marked.setOptions({ gfm: true, breaks: true })
    const renderer = new marked.Renderer()
    renderer.code = function (code, lang) {
      const language = (lang || 'plaintext').toLowerCase()
      let highlighted
      try { highlighted = hljs.highlight(code, { language, ignoreIllegals: true }).value }
      catch { highlighted = hljs.highlightAuto(code).value }
      const id = 'cb_' + Math.random().toString(36).slice(2, 9)
      return `<div class="code-wrapper"><div class="code-topbar"><span class="code-lang">${language}</span><button class="copy-btn" data-id="${id}">Copy</button></div><pre><code id="${id}" class="hljs">${highlighted}</code></pre></div>`
    }
    marked.use({ renderer })
    // initial welcome
    if (msgsRef.current) msgsRef.current.innerHTML = welcomeHTML()
  }, [])

  useEffect(() => {
    const unsub = observeAuth(u => setCurrentUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    // delegate copy buttons
    const root = msgsRef.current
    function onClick(e) {
      const btn = e.target.closest('.copy-btn')
      if (!btn) return
      const id = btn.getAttribute('data-id')
      const el = document.getElementById(id)
      if (el) navigator.clipboard.writeText(el.innerText).then(() => {
        btn.classList.add('copied'); btn.textContent = 'Copied!'
        setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = 'Copy' }, 2000)
      })
    }
    root && root.addEventListener('click', onClick)
    return () => root && root.removeEventListener('click', onClick)
  }, [])

  function welcomeHTML() {
    return `<div class="welcome" id="welcome"><div class="welcome-logo"><img src="${LOGO}" alt="Dazzlone"/></div><h2>Hi, I'm Dazzlone<br>How can I help?</h2><p>Use 🧠 Deep for step-by-step reasoning, or 🔍 Search for web research.</p><div class="chips"><div class="chip" data-quick>⚛️ Quantum computing</div><div class="chip" data-quick>🐍 Python script</div><div class="chip" data-quick>💡 Startup ideas</div><div class="chip" data-quick>🔍 AI news</div></div></div>`
  }

  function showToast(msg) {
    const t = document.getElementById('toast')
    if (!t) return
    t.textContent = msg; t.classList.add('show')
    setTimeout(() => t.classList.remove('show'), 2500)
  }

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

  function maybeDate() {
    if (!firstMsg) return
    const d = document.createElement('div'); d.className = 'date-divider';
    d.innerHTML = `<span>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>`
    msgsRef.current.appendChild(d); setFirstMsg(false)
  }

  async function searchDuckDuckGo(q) {
    try {
      const resp = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(q) + '&format=json&no_html=1&skip_disambig=1')
      const data = await resp.json()
      const abstract = data.AbstractText || ''
      const source = data.AbstractURL || ''
      let topics = ''
      if (Array.isArray(data.RelatedTopics)) {
        topics = data.RelatedTopics.slice(0, 4).map(t => (t.Text || (t.Topics && t.Topics[0] && t.Topics[0].Text) || '')).filter(Boolean).join('\n- ')
        if (topics) topics = '- ' + topics
      }
      const summary = `Abstract:\n${abstract || 'No short abstract available.'}\n\nRelated:\n${topics || 'None'}\n\nSource: ${source || 'DuckDuckGo'}`
      return { summary, source }
    } catch (e) {
      console.error('Search error', e)
      return { summary: 'Search failed (network or CORS).', source: '' }
    }
  }

  function addUser(text) {
    const w = document.getElementById('welcome'); if (w) w.remove(); maybeDate();
    const g = document.createElement('div'); g.className = 'msg-group user';
    g.innerHTML = `<div class="msg-label">You</div><div class="bubble">${esc(text)}</div>`;
    msgsRef.current.appendChild(g); msgsRef.current.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' })
  }

  function addTyping() {
    const w = document.getElementById('welcome'); if (w) w.remove();
    const g = document.createElement('div'); g.className = 'msg-group bot'; g.id = 'tg';
    g.innerHTML = `<div class="msg-label">Dazzlone</div><div class="bubble typing-bubble"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
    msgsRef.current.appendChild(g); msgsRef.current.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' });
    return g
  }

  function addBotBubble() {
    maybeDate(); const g = document.createElement('div'); g.className = 'msg-group bot';
    const lbl = document.createElement('div'); lbl.className = 'msg-label'; lbl.textContent = 'Dazzlone';
    const bbl = document.createElement('div'); bbl.className = 'bubble';
    g.appendChild(lbl); g.appendChild(bbl); msgsRef.current.appendChild(g); msgsRef.current.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' });
    return bbl
  }

  function streamThenRender(container, text) {
    container.classList.add('streaming-cursor'); container.className = 'bot-md';
    const chars = text.split(''); let i = 0; let out = '';
    const iv = setInterval(() => {
      if (i < chars.length) { out += chars[i++]; container.innerHTML = marked.parse(out); if (i % 8 === 0) msgsRef.current.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' }) }
      else { clearInterval(iv); container.classList.remove('streaming-cursor'); container.innerHTML = marked.parse(text); msgsRef.current.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' }) }
    }, 6)
  }

  function parseBlocks(raw) {
    let text = raw, thinkHtml = '', searchHtml = ''
    const thinkM = text.match(/<think>([\s\S]*?)<\/think>/i)
    if (thinkM) { const tid = 'th_' + Math.random().toString(36).slice(2, 7); thinkHtml = `<div class="think-box"><div class="think-header" onclick="document.getElementById('${tid}').classList.toggle('collapsed')">Thinking Process</div><div class="think-content" id="${tid}">${esc(thinkM[1].trim())}</div></div>`; text = text.replace(/<think>[\s\S]*?<\/think>/i, '').trim() }
    const searchM = text.match(/<search_info\s+query=["']([^"']*)["']\s*\/?>>?/i)
    if (searchM) { searchHtml = `<div class="search-box"><div class="search-header">Web Search Query</div><div class="search-query">"${esc(searchM[1])}"</div></div>`; text = text.replace(/<search_info[^>]*>/i, '').trim() }
    return { thinkHtml, searchHtml, cleanText: text }
  }

  function clearChat() { setHistory([]); setFirstMsg(true); msgsRef.current.innerHTML = welcomeHTML(); showToast('New chat started') }

  async function send(textArg, meta) {
    if (isTyping) return
    // accept optional metadata from InputBox (mode/power/userSegment)
    if (meta?.power) setPowerLevel(meta.power)
    if (meta?.mode) setModeState(meta.mode)
    if (meta?.userSegment) setUserSegment(meta.userSegment)

    const text = textArg !== undefined ? String(textArg).trim() : (inputRef.current?.getValue ? inputRef.current.getValue() : (inputRef.current && inputRef.current.value) || '').trim()
    if (!text) return
    setIsTyping(true)
    if (inputRef.current?.setValue) inputRef.current.setValue('')
    else if (inputRef.current) inputRef.current.value = ''
    addUser(text); setHistory(prev => [...prev, { role: 'user', content: text }]);
    // If search mode: fetch live search results first and display them
    let searchContext = ''
    if (mode === 'search') {
      const s = addBotBubble()
      s.insertAdjacentHTML('beforeend', `<div class="search-box"><div class="search-header">Web Search Query</div><div class="search-query">"${esc(text)}"</div></div>`)
      msgsRef.current.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' })
      const { summary } = await searchDuckDuckGo(text)
      // show a small summary box with results
      s.insertAdjacentHTML('beforeend', `<div class="think-box"><div class="think-header">Search Results (DuckDuckGo)</div><div class="think-content">${esc(summary)}</div></div>`)
      searchContext = `
Search results (DuckDuckGo):\n${summary}\n\n` // include as context for assistant
    }

    const tg = addTyping()
    try {
        const messagesPayload = [{ role: 'system', content: buildSystem() }]
        if (userSegment) messagesPayload.push({ role: 'system', content: `User segment: ${userSegment}` })
        if (searchContext) messagesPayload.push({ role: 'system', content: searchContext })
      // include conversation history + latest user content
      const payloadMessages = [...messagesPayload, ...history, { role: 'user', content: text }]

      const body = { model: 'sarvam-30b', messages: payloadMessages }
      // tweak generation for deep mode
      if (mode === 'deep') { body.temperature = 0.2; body.max_tokens = 2048 }

      const res = await fetch(API_URL, {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json(); tg.remove();
      let reply = data.choices?.[0]?.message?.content || ('**Error:** ' + (data.error?.message || 'No response.'))
      setHistory(h => [...h, { role: 'assistant', content: reply }])
      // save to remote DB if logged in
      try { if (currentUser && currentUser.uid) saveConversation(currentUser.uid, { timestamp: Date.now(), user: text, assistant: reply, meta: { mode, powerLevel, userSegment } }) } catch(e){console.error('save conv error', e)}
      const { thinkHtml, searchHtml, cleanText } = parseBlocks(reply)
      const bbl = addBotBubble()
      if (thinkHtml) bbl.insertAdjacentHTML('beforeend', thinkHtml)
      if (searchHtml) bbl.insertAdjacentHTML('beforeend', searchHtml)
      const textDiv = document.createElement('div'); bbl.appendChild(textDiv); streamThenRender(textDiv, cleanText)
    } catch (err) {
      tg.remove(); const bbl = addBotBubble(); bbl.className = 'bubble bot-md'; bbl.innerHTML = marked.parse('**Network Error** — please check your connection and try again.'); console.error(err)
    } finally { setIsTyping(false); inputRef.current && inputRef.current.focus() }
  }

  function buildSystem() {
    const base = `You are Dazzlone, a highly intelligent AI assistant created by Znill. When asked about your identity, creator, or who made you, always say: "I am Dazzlone, created by Znill."\n\nSTRICT FORMATTING RULES — follow every time:\n- Use **bold** for important terms and key concepts\n- Use ## for main sections, ### for subsections  \n- Use bullet points (- item) for lists of things\n- Use numbered lists (1. item) for steps or ranked items\n- Use \`inline code\` for function names, commands, file paths\n- ALWAYS use fenced code blocks with language for any code:\n\`\`\`python\n# code here\n\`\`\`\n- Use > for important notes, warnings, or tips\n- Add --- between major sections\n- Keep responses well-structured, clear, and professional`;
    if (mode === 'deep') return base + `\n\nDEEP THINKING MODE ACTIVE:\nFirst, wrap your reasoning inside <think>...</think> tags — think through the problem carefully, consider edge cases, weigh approaches. Then give a comprehensive, well-structured final answer outside the think block.`
    if (mode === 'search') return base + `\n\nWEB SEARCH MODE ACTIVE:\nStart with <search_info query="your search query here"/> to show what you're researching. Then provide the most thorough, up-to-date information available.`
    return base
  }

  // UI handlers
  useEffect(() => {
    function onQuick(e) {
      const chip = e.target.closest('[data-quick]')
      if (!chip) return
      const map = {
        0: 'Explain quantum computing simply',
        1: 'Write a Python web scraper with detailed comments',
        2: 'Give me 5 startup ideas for 2025 with detailed analysis',
        3: 'What are the latest AI breakthroughs?'
      }
      const chips = Array.from(msgsRef.current.querySelectorAll('.chip'))
      const idx = chips.indexOf(chip)
      if (map[idx]) {
        if (inputRef.current?.setValue) inputRef.current.setValue(map[idx])
        else if (inputRef.current) inputRef.current.value = map[idx]
        send(map[idx])
      }
    }
    msgsRef.current && msgsRef.current.addEventListener('click', onQuick)
    return () => msgsRef.current && msgsRef.current.removeEventListener('click', onQuick)
  }, [history])

  // receive mode/power callbacks from InputBox
  function handleModeChange(m) { setModeState(m) }
  function handlePowerChange(n) { setPowerLevel(n) }
  function handleSegmentChange(s) { setUserSegment(s) }

  // focus input when mode changes and show subtle toast
  useEffect(() => {
    inputRef.current && inputRef.current.focus()
    const modeLabel = mode === 'normal' ? 'Normal' : mode === 'deep' ? 'Deep Think' : 'Web Search'
    showToast(`${modeLabel} mode selected · Power ${powerLevel}`)
  }, [mode, powerLevel])

  return (
    <div className="app">
      <div className="header">
        <div className="header-left">
          <div className="logo-wrap"><img src={LOGO} alt="Dazzlone"/></div>
          <div className="header-info"><div className="header-name">Dazzlone</div><div className="header-sub"><div className="status-dot"></div><span>by Znill · always on</span></div></div>
        </div>
        <div className="header-right">
            <div className="icon-btn" onClick={clearChat} title="New Chat">+</div>
            <button className="three-dot-btn" title="Menu" onClick={()=>setSidebarOpen(true)}>
              <svg fill="#ffffff" viewBox="0 0 64 64" data-name="Layer 1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><title></title><path d="M21.86,18.73H9.18a2,2,0,0,1,0-4H21.86a2,2,0,0,1,0,4Z"></path><path d="M54.82,18.73H34.88a2,2,0,0,1,0-4H54.82a2,2,0,0,1,0,4Z"></path><path d="M54.82,34H9.18a2,2,0,0,1,0-4H54.82a2,2,0,0,1,0,4Z"></path><path d="M54.82,49.27H30.07a2,2,0,0,1,0-4H54.82a2,2,0,0,1,0,4Z"></path></g></svg>
            </button>
        </div>
      </div>

      <div className="messages-wrap" id="messages" ref={msgsRef}></div>

      <div className="scroll-btn" id="scrollBtn" style={{display:'none'}}></div>

      <div className="input-area">
        <div className={`mode-bar ${mode==='normal' ? 'hidden' : ''}`} id="modeBar">
          {mode === 'deep' ? (
            <svg id="modeBarIcon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>
          ) : (
            <svg id="modeBarIcon" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
          )}
          <div className="mode-text">{mode === 'deep' ? 'Advanced step-by-step reasoning' : 'Researching from web sources'}</div>
          <div className={`mode-badge ${mode === 'deep' ? 'deep' : 'search'}`}>{mode === 'deep' ? 'Deep Think' : 'Web Search'}</div>
        </div>
        <div className="input-row">
          <InputBox ref={inputRef} onSend={send} onModeChange={handleModeChange} onPowerChange={handlePowerChange} onSegmentChange={handleSegmentChange} />
        </div>
        <div className="input-footer">Dazzlone may make mistakes · Always verify important info</div>
      </div>

      <SidebarPanel open={sidebarOpen} onClose={()=>setSidebarOpen(false)} />

      <div className="toast" id="toast"></div>
    </div>
  )
}
