import React, { useEffect, useState } from 'react'
import { signIn, register, signOutUser, observeAuth, fetchHistoryOnce } from './firebase'

export default function SidebarPanel({ open, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsub = observeAuth(u => { setUser(u); if (u) loadHistory(u.uid) })
    return () => unsub()
  }, [])

  async function loadHistory(uid) {
    setLoading(true)
    try {
      const h = await fetchHistoryOnce(uid)
      setHistory(h || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function doLogin() {
    try {
      await signIn(email, password)
      setEmail(''); setPassword('')
    } catch (e) { alert('Login failed: ' + (e.message || e)) }
  }

  async function doRegister() {
    try { await register(email, password); setEmail(''); setPassword('') } catch (e) { alert('Register failed: ' + (e.message || e)) }
  }

  async function doSignOut() {
    try { await signOutUser() } catch (e) { console.error(e) }
  }

  if (!open) return null

  return (
    <div className="sidebar-overlay" onMouseDown={onClose}>
      <div className={`sidebar-panel ${open ? 'open' : ''}`} onMouseDown={e => e.stopPropagation()}>
        <div className="sidebar-header">
          <button className="back-btn" onClick={onClose} title="Back">
            <svg fill="#ffffff" height="24" width="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g><path d="M232.758,263.547l98.816-98.817c13.445-13.445,13.445-35.32,0-48.764c-13.445-13.445-35.32-13.446-48.765,0 L159.611,239.164c-13.445,13.446-13.445,35.321,0,48.765l123.197,123.198c6.512,6.512,15.171,10.099,24.382,10.099 c9.211,0,17.87-3.587,24.382-10.099c13.445-13.445,13.445-35.321,0-48.765L232.758,263.547z"/></g></svg>
          </button>
          <div className="sidebar-title">Account & Settings</div>
        </div>
        <div className="sidebar-content">
          <div className="account-section">
            {!user ? (
              <>
                <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
                <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
                <div className="account-actions">
                  <button onClick={doLogin}>Log in</button>
                  <button onClick={doRegister}>Register</button>
                </div>
                <p style={{color:'#9fbfdc',fontSize:13}}>Logging in enables saved history and settings.</p>
              </>
            ) : (
              <div>
                <div style={{marginBottom:8}}>Signed in as <strong>{user.email}</strong></div>
                <button onClick={doSignOut}>Sign out</button>
              </div>
            )}
          </div>

          <div className="history-section">
            <h4>History</h4>
            {loading ? <div>Loading...</div> : (
              <div className="history-list">
                {history.length === 0 ? <div className="muted">No saved conversations</div> : history.map(h => (
                  <div key={h.id} className="history-item">
                    <div className="hist-time">{new Date(h.timestamp || Date.now()).toLocaleString()}</div>
                    <div className="hist-snippet">{h.user?.slice(0,120) || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="settings-section">
            <h4>Settings</h4>
            <div className="muted">Theme, prompts, and other account settings go here.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
