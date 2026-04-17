import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'

function InputBox(props, ref) {
  const { onSend, onModeChange, onPowerChange } = props
  const innerRef = useRef(null)
  const [text, setText] = useState('')
  const placeholders = [
    'Ask anything...', 'Type something...', 'Ask your question...', "What's on your mind?", 'How can I help you?', 'Start a conversation...'
  ]
  const pIdx = useRef(0)
  const phRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [power, setPower] = useState(3)
  const [powerMenuOpen, setPowerMenuOpen] = useState(false)
  const [segmentMenuOpen, setSegmentMenuOpen] = useState(false)
  const [userSegment, setUserSegment] = useState('Individual')

  useImperativeHandle(ref, () => ({
    focus: () => innerRef.current && innerRef.current.focus(),
    getValue: () => (text || ''),
    setValue: (v) => { setText(String(v || '')) }
  }), [text])

  useEffect(() => {
    const iv = setInterval(() => {
      pIdx.current = (pIdx.current + 1) % placeholders.length
      if (phRef.current && (!text || text.trim().length === 0)) phRef.current.textContent = placeholders[pIdx.current]
    }, 3000)
    return () => clearInterval(iv)
  }, [text])

  

  function handleInput(e) {
    const val = e.target.innerText || ''
    setText(val)
    if (phRef.current) phRef.current.style.opacity = val.trim().length > 0 ? '0' : '1'
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); doSend()
    }
  }

  function doSend() {
    const t = (text || '').trim()
    if (!t) return
    onSend && onSend(t, { mode: props?.mode, power, userSegment })
    setText('')
    if (innerRef.current) innerRef.current.innerText = ''
    if (phRef.current) phRef.current.style.opacity = '1'
    innerRef.current && innerRef.current.focus()
  }

  function toggleMenu() {
    setMenuOpen(v => { const nv = !v; if (nv) { setPowerMenuOpen(false); setSegmentMenuOpen(false) } return nv })
  }

  function selectMode(m) {
    setMenuOpen(false)
    onModeChange && onModeChange(m)
  }

  function changePower(n) {
    setPower(n)
    setPowerMenuOpen(false)
    onPowerChange && onPowerChange(n)
  }

  function togglePowerMenu() {
    setPowerMenuOpen(v => { const nv = !v; if (nv) { setMenuOpen(false); setSegmentMenuOpen(false) } return nv })
  }

  function toggleSegmentMenu() {
    setSegmentMenuOpen(v => { const nv = !v; if (nv) { setMenuOpen(false); setPowerMenuOpen(false) } return nv })
  }

  function selectSegment(s) {
    setUserSegment(s)
    setSegmentMenuOpen(false)
    if (props.onSegmentChange) props.onSegmentChange(s)
  }

  

  return (
    <div className="chatbox-ui">
      <div className="input-area-ui">
        <div id="placeholder-ui" ref={phRef} className="placeholder-ui">{placeholders[0]}</div>
        <div id="chatInput-ui" ref={innerRef} contentEditable onInput={handleInput} onKeyDown={handleKey} spellCheck={false} className="chat-input" />
      </div>

      <div className="toolbar-ui">
          <div style={{position:'relative'}}>
          <button className={`icon-btn-ui plus-btn ${menuOpen? 'active':''}`} title="Modes" onClick={toggleMenu}>✚</button>
          {menuOpen && (
            <div className="mode-menu mode-menu-up">
              <div className="mode-item" onClick={()=>selectMode('thinking')}>
                <span className="menu-icon">
                  <svg viewBox="0 0 503.309 503.309" width="20" height="20" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><path d="M503.309,236.046c0-37.872-27.077-69.924-63.765-76.712c-0.348-0.599-0.683-1.2-1.028-1.795 c-26.543-45.151-68.317-79.408-117.65-96.469c-0.011-0.005-0.021,0-0.021-0.005c-12.283-27.076-39.502-45.99-71.114-45.99 c-31.42,0-58.497,18.688-70.875,45.502c-50.369,16.98-92.654,51.507-119.531,97.574C25.317,166.583,0,197.282,0,233.873 c0,25.452,12.299,48.029,31.215,62.298c0,0.011,0,0.011,0,0.011c13.696,109.491,107.362,192.053,217.859,192.053 c108.979,0,200.233-78.037,216.958-185.555c0.021-0.063-0.01-0.115-0.01-0.189C488.353,288.726,503.309,264.133,503.309,236.046z"/></svg>
                </span>
                <span>Thinking</span>
              </div>
              <div className="mode-item" onClick={()=>selectMode('deep')}>
                <span className="menu-icon">
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M8 16L3.54223 12.3383C1.93278 11.0162 1 9.04287 1 6.96005C1 3.11612 4.15607 0 8 0C11.8439 0 15 3.11612 15 6.96005C15 9.04287 14.0672 11.0162 12.4578 12.3383L8 16ZM3 6H5C6.10457 6 7 6.89543 7 8V9L3 7.5V6ZM11 6C9.89543 6 9 6.89543 9 8V9L13 7.5V6H11Z" fill="#ffffff"/></svg>
                </span>
                <span>Deep Thinking</span>
              </div>
              <div className="mode-item" onClick={()=>selectMode('search')}>
                <span className="menu-icon">
                  <svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="#ffffff"><path d="m 8 0 c -0.554688 0 -1 0.445312 -1 1 v 1 c 0 0.03125 0 0.058594 0.003906 0.085938 c -2.507812 0.421874 -4.492187 2.410156 -4.914062 4.917968 c -0.03125 -0.003906 -0.058594 -0.003906 -0.089844 -0.003906 h -1 c -0.554688 0 -1 0.445312 -1 1 s 0.445312 1 1 1 h 1 c 0.03125 0 0.058594 0 0.089844 -0.003906 c 0.421875 2.507812 2.40625 4.496094 4.914062 4.917968 c 0 0.027344 -0.003906 0.054688 -0.003906 0.085938 v 1 c 0 0.554688 0.445312 1 1 1 s 1 -0.445312 1 -1 v -1 c 0 -0.03125 0 -0.058594 -0.003906 -0.085938 c 2.507812 -0.421874 4.496094 -2.410156 4.917968 -4.917968 c 0.03125 0 0.058594 0.003906 0.085938 0.003906 h 1 c 0.554688 0 1 -0.445312 1 -1 s -0.445312 -1 -1 -1 h -1 c -0.027344 0 -0.054688 0 -0.085938 0.003906 c -0.421874 -2.507812 -2.410156 -4.496094 -4.917968 -4.917968 c 0 -0.027344 0.003906 -0.058594 0.003906 -0.085938 v -1 c 0 -0.554688 -0.445312 -1 -1 -1 z m 0.003906 4 c 2.199219 0 4 1.796875 4 4 s -1.800781 4 -4 4 c -2.203125 0 -4 -1.796875 -4 -4 s 1.796875 -4 4 -4 z m -0.003906 2 c -1.105469 0 -2 0.894531 -2 2 s 0.894531 2 2 2 s 2 -0.894531 2 -2 s -0.894531 -2 -2 -2 z m 0 0"/></svg>
                </span>
                <span>Search / Research</span>
              </div>
              <div className="mode-item" onClick={()=>selectMode('quiz')}>
                <span className="menu-icon">
                  <svg viewBox="0 0 192 192" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none"><g><path d="M75.844 74.849s-2.533-9.473-.475-16.462C77.427 51.4 85.082 43.36 96 42.907c12.707-.526 19.094 8.366 19.25 20.59.263 20.674-20.972 27.135-20.972 51.732v8.907" stroke="#ffffff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/><circle cx="96" cy="96" r="74" stroke="#ffffff" strokeWidth="12"/></g></svg>
                </span>
                <span>Quiz</span>
              </div>
              <div className="mode-item" onClick={()=>selectMode('simple')}>
                <span className="menu-icon">
                  <svg viewBox="0 0 192 192" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="#ffffff"><path d="M52.5 170c-4.4-.2-8.4.3-10.1-3.8-1.8-4.4.2-8 3.4-11 5.1-4.6 10.9-8.3 17-11.4 14.2-7.2 28.4-14.2 42.6-21.1 4.5-2.2 8.8-4.5 12.5-7.7 8-6.7 7.1-13-2.8-16-7.5-2.3-15.5-3.4-23.2-4.9-9.9-2-19.9-3.7-29.7-6-5.3-1.3-10.7-3.5-12.1-9.8-1.4-6.5 2.3-11 7.1-14.6C75.5 49.8 94.3 36.6 115 26.4c5.7-2.8 11.6-5.2 18.1-4.1 5.5.9 10 3.4 11.5 9.1 1.6 5.9-2.1 9.2-6.7 11.7-16.2 9.2-45 24.3-48.5 27.5s-.6 7 2.9 7.6c12.1 2.2 22.7 4 34.3 8.6 4.3 1.7 8.7 3.5 12.6 5.9 13.1 8.2 14.6 19.9 4.4 31.7-6.5 7.5-14.5 13.3-23 18.4-19.1 11.5-39.5 19.9-60.9 26-2.6.8-5.4.9-7.2 1.2z"/></svg>
                </span>
                <span>Simple</span>
              </div>
              <div className="mode-item" onClick={()=>selectMode('arguments')}>
                <span className="menu-icon">
                  <svg viewBox="0 0 48 48" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="#ffffff"><path d="M17.2423,36.02a2.67,2.67,0,0,0-.5926,1.691A2.7086,2.7086,0,0,0,19.3583,40.42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/><path d="M19.3583,7.58a2.7073,2.7073,0,0,0-2.2517,4.2124,9.8889,9.8889,0,0,0-7.64,9.6249v9.3034L6.9187,32.7864A1.82,1.82,0,0,0,8.065,36.02H19.3583" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                </span>
                <span>Arguments</span>
              </div>
            </div>
          )}
        </div>

        <div style={{position:'relative'}}>
          <button className="computer-chip-ui segment-btn" onClick={toggleSegmentMenu}><span style={{fontSize:13,color:'#e6f7ff'}}>User Segment</span></button>
          {segmentMenuOpen && (
            <div className="mode-menu mode-menu-up">
              <div className="mode-item" onClick={()=>selectSegment('Individual')}>Individual</div>
              <div className="mode-item" onClick={()=>selectSegment('Student')}>Student</div>
              <div className="mode-item" onClick={()=>selectSegment('Business Owner')}>Business Owner</div>
              <div className="mode-item" onClick={()=>selectSegment('Corporate Professional')}>Corporate Professional</div>
              <div className="mode-item" onClick={()=>selectSegment('Freelancer')}>Freelancer</div>
              <div className="mode-item" onClick={()=>selectSegment('Developer / Tech')}>Developer / Tech</div>
              <div className="mode-item" onClick={()=>selectSegment('Creator')}>Creator (YouTuber, Influencer, etc.)</div>
              <div className="mode-item" onClick={()=>selectSegment('Job Seeker')}>Job Seeker</div>
              <div className="mode-item" onClick={()=>selectSegment('Astrology Enthusiast')}>Astrology Enthusiast</div>
              <div className="mode-item" onClick={()=>selectSegment('Other')}>Other</div>
            </div>
          )}
        </div>
        <div className="spacer-ui" />

        <div style={{position:'relative'}} className="power-wrap">
          <button className="power-btn" onClick={togglePowerMenu}>Power: {power}</button>
          {powerMenuOpen && (
            <div className="mode-menu mode-menu-up">
              {[1,2,3,4,5].map(n => (
                <div key={n} className="mode-item" onClick={()=>changePower(n)}>Level {n}</div>
              ))}
            </div>
          )}
        </div>

        <button className="send-btn-ui" title="Send" onClick={doSend}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.5 9H3.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path> <path d="M5 15L4 15" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path> <path d="M4 12H2" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path> <path d="M12.0409 12.7649C12.4551 12.7649 12.7909 12.4291 12.7909 12.0149C12.7909 11.6007 12.4551 11.2649 12.0409 11.2649V12.7649ZM9.26797 12.7649H12.0409V11.2649H9.26797V12.7649Z" fill="#ffffff"></path> <path d="M11.8369 4.80857L12.1914 4.14766L11.8369 4.80857ZM20.5392 9.47684L20.1846 10.1377L20.5392 9.47684ZM20.5356 14.5453L20.8891 15.2068L20.5356 14.5453ZM11.8379 19.1934L11.4844 18.5319H11.4844L11.8379 19.1934ZM8.13677 15.7931L7.41828 15.578L8.13677 15.7931ZM8.13127 8.2039L7.41256 8.41827L8.13127 8.2039ZM9.18255 11.7286L8.46384 11.9429L9.18255 11.7286ZM11.4823 5.46948L20.1846 10.1377L20.8937 8.81593L12.1914 4.14766L11.4823 5.46948ZM20.1821 13.8839L11.4844 18.5319L12.1914 19.8548L20.8891 15.2068L20.1821 13.8839ZM8.85526 16.0082L9.90074 12.5163L8.46376 12.0861L7.41828 15.578L8.85526 16.0082ZM9.90126 11.5142L8.84998 7.98954L7.41256 8.41827L8.46384 11.9429L9.90126 11.5142ZM11.4844 18.5319C10.7513 18.9237 9.98824 18.7591 9.44091 18.2563C8.88829 17.7486 8.58451 16.9125 8.85526 16.0082L7.41828 15.578C6.97411 17.0615 7.47325 18.4855 8.4261 19.3609C9.38423 20.2411 10.8292 20.5828 12.1914 19.8548L11.4844 18.5319ZM20.1846 10.1377C21.6065 10.9005 21.6046 13.1236 20.1821 13.8839L20.8891 15.2068C23.3683 13.8819 23.3707 10.1447 20.8937 8.81593L20.1846 10.1377ZM12.1914 4.14766C10.8301 3.41739 9.38432 3.75692 8.42486 4.63604C7.47072 5.5103 6.96983 6.93392 7.41256 8.41827L8.84998 7.98954C8.5801 7.08467 8.88494 6.24894 9.43821 5.74199C9.98618 5.23991 10.7495 5.07638 11.4823 5.46948L12.1914 4.14766ZM9.90074 12.5163C9.9986 12.1895 9.99878 11.8412 9.90126 11.5142L8.46384 11.9429C8.47777 11.9896 8.47774 12.0394 8.46376 12.0861L9.90074 12.5163Z" fill="#363853"></path> </g></svg>
        </button>
      </div>
    </div>
  )
}

export default React.forwardRef(InputBox)
