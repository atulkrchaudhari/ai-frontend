const API = "https://bug-free-potato-76prw4rjxxghp9g-3001.app.github.dev";

import React, { useState } from 'react'

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

export default function App() {
  const [tab, setTab] = useState('chat')
  return (
    <div className="min-h-screen p-6">
      <header className="max-w-4xl mx-auto mb-6">
        <h1 className="text-3xl font-bold">Full-Stack AI Boilerplate</h1>
        <p className="text-gray-600">Chat • Knowledge (RAG) • n8n</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => setTab('chat')} className={`px-3 py-1 rounded-lg ${tab==='chat'?'bg-black text-white':'bg-white border'}`}>Chat</button>
          <button onClick={() => setTab('knowledge')} className={`px-3 py-1 rounded-lg ${tab==='knowledge'?'bg-black text-white':'bg-white border'}`}>Knowledge</button>
          <button onClick={() => setTab('search')} className={`px-3 py-1 rounded-lg ${tab==='search'?'bg-black text-white':'bg-white border'}`}>Search</button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto">
        {tab==='chat' && <Chat />}
        {tab==='knowledge' && <Knowledge />}
        {tab==='search' && <Search />}
      </main>
    </div>
  )
}

function Chat() {
  const [messages, setMessages] = useState([{ role:'assistant', content:'Hi! Ask me anything.' }])
  const [input, setInput] = useState('')
  const [useRag, setUseRag] = useState(true)
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const next = [...messages, { role:'user', content: input }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ messages: next, useRag })
      })
      const data = await res.json()
      setMessages([...next, { role:'assistant', content: data.answer || data.error }])
    } catch (e) {
      setMessages([...next, { role:'assistant', content: 'Error: '+ e.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useRag} onChange={e=>setUseRag(e.target.checked)} />
          Use RAG context
        </label>
      </div>
      <div className="space-y-3 max-h-[50vh] overflow-y-auto border rounded-lg p-3">
        {messages.map((m,i)=>(
          <div key={i} className={`p-2 rounded-xl ${m.role==='assistant'?'bg-gray-50':'bg-blue-50'}`}>
            <div className="text-xs text-gray-500">{m.role}</div>
            <div>{m.content}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input className="flex-1 border rounded-xl px-3 py-2" value={input} onChange={e=>setInput(e.target.value)} placeholder="Type a message..." />
        <button onClick={send} disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white">{loading?'Thinking...':'Send'}</button>
      </div>
    </div>
  )
}

function Knowledge() {
  const [text, setText] = useState('Paste any reference text here, then click Ingest to add it to the vector store.')
  const [status, setStatus] = useState('')

  async function ingest() {
    setStatus('Ingesting...')
    try {
      const res = await fetch(`${API}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ texts: text.split('\n\n').map(s=>s.trim()).filter(Boolean) })
      })
      const data = await res.json()
      setStatus(`Inserted ${data.inserted?.length || 0} chunks.`)
    } catch (e) {
      setStatus('Error: ' + e.message)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
      <textarea className="w-full h-60 border rounded-xl p-3" value={text} onChange={e=>setText(e.target.value)} />
      <div className="flex items-center justify-between">
        <button onClick={ingest} className="px-4 py-2 rounded-xl bg-black text-white">Ingest</button>
        <div className="text-sm text-gray-600">{status}</div>
      </div>
    </div>
  )
}

function Search() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])

  async function run() {
    const res = await fetch(`${API}/api/search?q=`+encodeURIComponent(q))
    const data = await res.json()
    setResults(data.results || [])
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
      <div className="flex gap-2">
        <input className="flex-1 border rounded-xl px-3 py-2" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search your knowledge..." />
        <button onClick={run} className="px-4 py-2 rounded-xl bg-black text-white">Search</button>
      </div>
      <ul className="space-y-2">
        {results.map(r=>(
          <li key={r.id} className="border rounded-xl p-3">
            <div className="text-xs text-gray-500">score: {r.score.toFixed(4)}</div>
            <div>{r.text}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
