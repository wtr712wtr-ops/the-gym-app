'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_LINE_ID = 'U0f4c1d79f182f727c49b0b1bfbace466';

export default function AdminPage() {
    const router = useRouter();
    const [adminId, setAdminId] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [memos, setMemos] = useState([]);
    const [newMemo, setNewMemo] = useState('');
    const [newClientName, setNewClientName] = useState('');
    const [tab, setTab] = useState('list');

  useEffect(() => {
        const stored = localStorage.getItem('line_user_id');
        if (!stored || stored !== ADMIN_LINE_ID) { router.push('/'); return; }
        setAdminId(stored);
        fetchClients(stored);
  }, []);

  const fetchClients = async (id) => {
        const res = await fetch('/api/memo?adminId=' + id);
        const data = await res.json();
        setClients((data.clients || []).map(c => JSON.parse(c)));
  };

  const fetchMemos = async (clientId) => {
        const res = await fetch('/api/memo?adminId=' + adminId + '&clientId=' + clientId);
        const data = await res.json();
        setMemos((data.memos || []).map(m => JSON.parse(m)));
  };

  const handleSelectClient = (c) => { setSelectedClient(c); fetchMemos(c.id); setTab('memo'); };

  const handleAddMemo = async () => {
        if (!newMemo.trim()) return;
        await fetch('/api/memo', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ adminId, action: 'addMemo', clientId: selectedClient.id, memo: newMemo }) });
        setNewMemo(''); fetchMemos(selectedClient.id);
  };

  const handleAddClient = async () => {
        if (!newClientName.trim()) return;
        const clientId = 'client_' + Date.now();
        await fetch('/api/memo', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ adminId, action: 'addClient', clientId, clientName: newClientName }) });
        setNewClientName(''); fetchClients(adminId); setTab('list');
  };

  if (!adminId) return <p style={{padding:20}}>認証確認中...</p>;

  return (
        <div style={{maxWidth:480,margin:'0 auto',padding:16,fontFamily:'sans-serif'}}>
      <h2 style={{color:'#1a1a2e'}}>管理者画面</h2>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
{['list','addClient'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',background:tab===t?'#4CAF82':'#eee',color:tab===t?'#fff':'#333',fontWeight:600}}>
{t==='list'?'クライアント一覧':'クライアント追加'}
</button>
        ))}
</div>
{tab==='list'&&<div>{clients.length===0&&<p style={{color:'#999'}}>クライアントがまだいません</p>}{clients.map(c=>(<div key={c.id} onClick={()=>handleSelectClient(c)} style={{padding:14,marginBottom:8,borderRadius:10,background:'#f9f9f9',border:'1px solid #e0e0e0',cursor:'pointer',display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:600}}>{c.name}</span><span style={{color:'#4CAF82'}}>メモを見る</span></div>))}</div>}
{tab==='addClient'&&<div><input value={newClientName} onChange={e=>setNewClientName(e.target.value)} placeholder="クライアント名を入力" style={{width:'100%',padding:12,borderRadius:8,border:'1px solid #ccc',fontSize:16,boxSizing:'border-box'}}/><button onClick={handleAddClient} style={{marginTop:10,width:'100%',padding:14,background:'#4CAF82',color:'#fff',border:'none',borderRadius:8,fontSize:16,cursor:'pointer'}}>追加する</button></div>}
{tab==='memo'&&selectedClient&&(
          <div>
            <button onClick={()=>setTab('list')} style={{background:'none',border:'none',color:'#4CAF82',cursor:'pointer',fontSize:14,marginBottom:8}}>一覧に戻る</button>
          <h3 style={{marginBottom:12}}>{selectedClient.name}のメモ</h3>
          <textarea value={newMemo} onChange={e=>setNewMemo(e.target.value)} placeholder="メモ・注意点を入力" rows={4} style={{width:'100%',padding:12,borderRadius:8,border:'1px solid #ccc',fontSize:15,boxSizing:'border-box',resize:'vertical'}}/>
          <button onClick={handleAddMemo} style={{marginTop:8,width:'100%',padding:14,background:'#4CAF82',color:'#fff',border:'none',borderRadius:8,fontSize:16,cursor:'pointer'}}>保存する</button>
          <div style={{marginTop:20}}>{memos.map((m,i)=>(<div key={i} style={{padding:12,marginBottom:8,background:'#f5f5f5',borderRadius:8,borderLeft:'3px solid #4CAF82'}}><p style={{margin:0}}>{m.text}</p><p style={{margin:'4px 0 0',fontSize:12,color:'#999'}}>{m.date}</p></div>))}</div>
  </div>
      )}
   
