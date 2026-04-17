import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { getDatabase, ref, push, set, get, child } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBcjUtfNxD4fHv6uiHXAEkN8wXtQBkVbCA",
  authDomain: "dazzlone.firebaseapp.com",
  databaseURL: "https://dazzlone-default-rtdb.firebaseio.com",
  projectId: "dazzlone",
  storageBucket: "dazzlone.appspot.com",
  messagingSenderId: "382204259427",
  appId: "1:382204259427:web:082bded8ccdd8f03329c56",
  measurementId: "G-CMCHP4WLH8"
}

const app = initializeApp(firebaseConfig)
try { getAnalytics(app) } catch (e) { /* analytics may fail in some envs */ }
const auth = getAuth(app)
const db = getDatabase(app)

function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

function signOutUser() {
  return signOut(auth)
}

function observeAuth(cb) {
  return onAuthStateChanged(auth, cb)
}

async function saveConversation(uid, item) {
  if (!uid) return
  const node = ref(db, `users/${uid}/history`)
  const p = push(node)
  return set(p, item)
}

async function fetchHistoryOnce(uid) {
  if (!uid) return null
  const dbRef = ref(db)
  const snap = await get(child(dbRef, `users/${uid}/history`))
  if (!snap.exists()) return []
  const data = snap.val()
  return Object.keys(data).map(k => ({ id: k, ...data[k] }))
}

export { app, auth, db, signIn, register, signOutUser, observeAuth, saveConversation, fetchHistoryOnce }
