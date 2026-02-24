import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMessagesForUser, getSentMessagesForUser, sendMessage,
  acceptMessage, rejectMessage, isBlocked, markMessageRead,
  sendChatMessage, subscribeToChatMessages, getAcceptedContacts,
  Message, ChatMessage
} from '../services/messages';
import { getAllUsers } from '../services/users';
import { createMessageNotification } from '../services/notifications';
import { db } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import {
  Mail, Search, Send, X, CheckCircle, XCircle,
  UserPlus, Calendar, ChevronRight, PenSquare,
  ArrowLeft, MessageCircle, Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';

type View = 'list' | 'chat';
type Tab = 'chats' | 'requests';

export const MessagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>('chats');
  const [view, setView] = useState<View>('list');

  const [inbox, setInbox] = useState<Message[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Message | null>(null);
  const [addingToTeam, setAddingToTeam] = useState(false);
  const [addedSenders, setAddedSenders] = useState<Set<string>>(new Set());

  const [contacts, setContacts] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const [showCompose, setShowCompose] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [dmText, setDmText] = useState('');
  const [sendingDM, setSendingDM] = useState(false);
  const [blockedError, setBlockedError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!currentUser) return;
    const [inc, users, contactIds] = await Promise.all([
      getMessagesForUser(currentUser.id),
      getAllUsers(),
      getAcceptedContacts(currentUser.id),
    ]);
    const others = users.filter(u => u.id !== currentUser.id);
    setAllUsers(others);
    setInbox(inc);
    setContacts(others.filter(u => contactIds.includes(u.id)));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const openChat = (partner: User) => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    setChatPartner(partner);
    setChatMessages([]);
    setView('chat');
    unsubRef.current = subscribeToChatMessages(currentUser!.id, partner.id, setChatMessages);
  };

  const handleSendChat = async () => {
    if (!chatText.trim() || !chatPartner || !currentUser) return;
    setSendingChat(true);
    try {
      await sendChatMessage({
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: (currentUser as any).avatar || '',
        recipientId: chatPartner.id,
        text: chatText.trim(),
      });
      setChatText('');
    } catch { alert('Failed to send.'); }
    finally { setSendingChat(false); }
  };

  const handleAccept = async (msg: Message) => {
    await acceptMessage(msg.id);
    setInbox(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'accepted' } : m));
    setSelectedRequest(prev => prev ? { ...prev, status: 'accepted' } : null);
    await fetchAll();
  };

  const handleReject = async (msg: Message) => {
    await rejectMessage(msg.id, msg.senderId, currentUser!.id);
    setInbox(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'rejected' } : m));
    setSelectedRequest(null);
  };

  const handleOpenRequest = async (msg: Message) => {
    setSelectedRequest(msg);
    if (!msg.read) {
      await markMessageRead(msg.id);
      setInbox(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    }
  };

  const handleAddToTeam = async (msg: Message) => {
    if (!currentUser || !msg.eventId) return;
    setAddingToTeam(true);
    try {
      const teamsSnap = await getDocs(query(collection(db, 'teams'), where('leaderId', '==', currentUser.id), where('eventId', '==', msg.eventId)));
      if (teamsSnap.empty) { alert("You don't have a team for this event yet!"); return; }
      const teamDoc = teamsSnap.docs[0];
      const teamData = teamDoc.data();
      if (teamData.members?.includes(msg.senderId)) { alert('Already in your team!'); return; }
      if ((teamData.members?.length || 0) >= teamData.maxMembers) { alert('Team is full!'); return; }
      await updateDoc(doc(db, 'teams', teamDoc.id), { members: arrayUnion(msg.senderId) });
      setAddedSenders(prev => new Set(prev).add(msg.senderId));
      setSelectedRequest(null);
      alert('Added to team! 🌸');
    } catch { alert('Failed to add to team.'); }
    finally { setAddingToTeam(false); }
  };

  const handleSendDM = async () => {
    if (!selectedRecipient || !dmText.trim() || !currentUser) return;
    setSendingDM(true);
    setBlockedError(false);
    try {
      const blocked = await isBlocked(currentUser.id, selectedRecipient.id);
      if (blocked) { setBlockedError(true); return; }
      const msgId = await sendMessage({
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: (currentUser as any).avatar || '',
        recipientId: selectedRecipient.id,
        content: dmText.trim(),
        type: 'dm',
      });
      await createMessageNotification({
        recipientId: selectedRecipient.id,
        senderName: currentUser.name,
        senderId: currentUser.id,
        senderAvatar: (currentUser as any).avatar || '',
        messageId: msgId,
      });
      setShowCompose(false);
      setSelectedRecipient(null);
      setDmText('');
      setUserSearch('');
      await fetchAll();
      setTab('requests');
    } catch (err: any) {
      if (err.message === 'BLOCKED') setBlockedError(true);
      else alert('Failed to send.');
    } finally { setSendingDM(false); }
  };

  const pendingRequests = inbox.filter(m => m.status === 'pending');
  const unreadCount = pendingRequests.filter(m => !m.read).length;
  const filteredUsers = allUsers.filter(u => userSearch.trim() && u.name.toLowerCase().includes(userSearch.toLowerCase()));

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  // ── CHAT VIEW ──────────────────────────────────────────────────────
  if (view === 'chat' && chatPartner) {
    return (
      <div className="flex flex-col h-[calc(100vh-12rem)] max-w-2xl mx-auto">
        <div className="flex items-center gap-4 p-4 bg-[#fdf6f0] rounded-t-2xl border border-rose/10 border-b border-rose/10">
          <button onClick={() => { setView('list'); if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } }}
            className="p-2 hover:bg-rose/10 rounded-xl transition-colors text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-rose/10 border-2 border-rose/20 flex items-center justify-center overflow-hidden shrink-0">
            {(chatPartner as any).avatar
              ? <img src={(chatPartner as any).avatar} className="w-full h-full object-cover" alt="" />
              : <span className="text-rose font-bold">{chatPartner.name?.[0]?.toUpperCase()}</span>}
          </div>
          <div>
            <p className="font-bold text-charcoal">{chatPartner.name}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{chatPartner.role}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdf6f0] border-x border-rose/10">
          {chatMessages.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Say hi to {chatPartner.name?.split(' ')[0]}! 👋</div>
          )}
          {chatMessages.map(msg => {
            const isMine = msg.senderId === currentUser!.id;
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine ? 'bg-rose text-white rounded-br-sm' : 'bg-white border border-rose/10 text-charcoal rounded-bl-sm'
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-[9px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="flex items-center gap-3 p-4 bg-[#fdf6f0] rounded-b-2xl border border-rose/10 border-t border-rose/10">
          <input value={chatText} onChange={e => setChatText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
            placeholder={`Message ${chatPartner.name?.split(' ')[0]}...`}
            className="flex-1 px-4 py-2.5 rounded-full border border-rose/20 bg-white text-charcoal text-sm outline-none focus:ring-2 focus:ring-rose" />
          <button onClick={handleSendChat} disabled={sendingChat || !chatText.trim()}
            className="w-10 h-10 bg-rose rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 shrink-0">
            <Send size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-3xl font-serif">Messages</h2>
            <p className="text-gray-400 text-sm">Chats and team invites.</p>
          </div>
          {unreadCount > 0 && <span className="w-6 h-6 bg-rose rounded-full text-white text-xs font-bold flex items-center justify-center">{unreadCount}</span>}
        </div>
        <button onClick={() => { setShowCompose(true); setSelectedRecipient(null); setDmText(''); setUserSearch(''); setBlockedError(false); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90">
          <PenSquare size={14} /> New Message
        </button>
      </div>

      <div className="flex gap-2">
        {([['chats', 'Chats', <MessageCircle size={12} />], ['requests', 'Requests', <Inbox size={12} />]] as const).map(([key, label, icon]) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
              tab === key ? 'bg-rose text-white border-rose' : 'bg-white text-gray-500 border-gray-200 hover:border-rose hover:text-rose'
            }`}>
            {icon}{label}
            {key === 'requests' && unreadCount > 0 && (
              <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${tab === 'requests' ? 'bg-white text-rose' : 'bg-rose text-white'}`}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'chats' && (
        contacts.length === 0 ? (
          <div className="bg-[#fdf6f0] rounded-3xl p-16 border border-rose/10 text-center space-y-3">
            <MessageCircle size={40} className="mx-auto text-rose/20" />
            <p className="text-gray-400">No chats yet.</p>
            <p className="text-xs text-gray-300">Accept a message request to start chatting!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact, idx) => (
              <motion.div key={contact.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <div onClick={() => openChat(contact)}
                  className="bg-[#fdf6f0] rounded-2xl p-4 border border-rose/10 cursor-pointer hover:border-rose/30 hover:shadow-md transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose/10 border-2 border-rose/20 flex items-center justify-center overflow-hidden shrink-0">
                    {(contact as any).avatar ? <img src={(contact as any).avatar} className="w-full h-full object-cover" alt="" />
                      : <span className="text-rose font-bold text-lg">{contact.name?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-charcoal">{contact.name}</p>
                    <p className="text-xs text-gray-400">{contact.role}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {tab === 'requests' && (
        inbox.length === 0 ? (
          <div className="bg-[#fdf6f0] rounded-3xl p-16 border border-rose/10 text-center space-y-3">
            <Mail size={40} className="mx-auto text-rose/20" />
            <p className="text-gray-400">No message requests yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {inbox.map((msg, idx) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <div onClick={() => handleOpenRequest(msg)}
                  className={`bg-[#fdf6f0] rounded-2xl p-4 border cursor-pointer hover:shadow-md transition-all flex items-start gap-4 ${!msg.read && msg.status === 'pending' ? 'border-rose/40' : 'border-rose/10'}`}>
                  <div className="w-10 h-10 rounded-full bg-rose/10 border-2 border-rose/20 flex items-center justify-center overflow-hidden shrink-0">
                    {msg.senderAvatar ? <img src={msg.senderAvatar} className="w-full h-full object-cover" alt="" />
                      : <span className="text-rose font-bold text-sm">{msg.senderName?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-charcoal text-sm flex items-center gap-2">
                        {msg.senderName}
                        {!msg.read && msg.status === 'pending' && <span className="w-2 h-2 bg-rose rounded-full" />}
                      </p>
                      <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    {msg.eventName && <div className="flex items-center gap-1 text-[10px] text-rose font-bold mt-0.5"><Calendar size={9} />{msg.eventName}</div>}
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{msg.content}</p>
                  </div>
                  <div className="shrink-0">
                    {msg.status === 'accepted' && <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-1 rounded-full">Accepted</span>}
                    {msg.status === 'rejected' && <span className="text-[10px] bg-red-50 text-red-400 font-bold px-2 py-1 rounded-full">Rejected</span>}
                    {msg.status === 'pending' && <span className="text-[10px] bg-rose/10 text-rose font-bold px-2 py-1 rounded-full flex items-center gap-1">View <ChevronRight size={10} /></span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Request Detail Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRequest(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#fdf6f0] rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-rose/20 border-2 border-rose/20 flex items-center justify-center overflow-hidden">
                    {selectedRequest.senderAvatar ? <img src={selectedRequest.senderAvatar} className="w-full h-full object-cover" alt="" />
                      : <span className="text-rose font-bold text-lg">{selectedRequest.senderName?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div>
                    <p className="font-bold text-charcoal">{selectedRequest.senderName}</p>
                    {selectedRequest.eventName && <p className="text-[10px] text-rose font-bold uppercase tracking-widest">For {selectedRequest.eventName}</p>}
                    <p className="text-[10px] text-gray-400">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>

              <div className="bg-white/60 rounded-2xl p-5 border border-rose/10">
                <p className="text-sm text-charcoal leading-relaxed">{selectedRequest.content}</p>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3">
                  <button onClick={() => handleReject(selectedRequest)}
                    className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-50">
                    <XCircle size={15} /> Reject
                  </button>
                  <button onClick={() => handleAccept(selectedRequest)}
                    className="flex-1 py-3 rounded-xl bg-rose text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90">
                    <CheckCircle size={15} /> Accept
                  </button>
                </div>
              )}

              {selectedRequest.status === 'accepted' && (
                <div className="space-y-3">
                  <button onClick={() => {
                    setSelectedRequest(null);
                    const partner = allUsers.find(u => u.id === selectedRequest.senderId);
                    if (partner) { setTab('chats'); openChat(partner); }
                  }} className="w-full py-3 rounded-xl bg-rose text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90">
                    <MessageCircle size={14} /> Open Chat
                  </button>
                  {selectedRequest.eventId && !addedSenders.has(selectedRequest.senderId) && (
                    <button onClick={() => handleAddToTeam(selectedRequest)} disabled={addingToTeam}
                      className="w-full py-3 rounded-xl border-2 border-rose text-rose text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose/5 disabled:opacity-50">
                      <UserPlus size={14} /> {addingToTeam ? 'Adding...' : 'Add to Team'}
                    </button>
                  )}
                  {addedSenders.has(selectedRequest.senderId) && (
                    <div className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle size={14} /> Added to Team!
                    </div>
                  )}
                </div>
              )}

              {selectedRequest.status === 'rejected' && (
                <div className="w-full py-3 rounded-xl bg-red-50 text-red-400 text-sm font-bold flex items-center justify-center gap-2">
                  <XCircle size={14} /> Message Rejected
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose DM Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCompose(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#fdf6f0] rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-5"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif text-charcoal">New Message</h3>
                <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>

              {!selectedRecipient ? (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">To</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input autoFocus value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search by name..."
                      className="w-full pl-9 pr-4 py-2.5 border border-rose/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose bg-white/60" />
                  </div>
                  {filteredUsers.length > 0 && (
                    <div className="border border-rose/10 rounded-2xl overflow-hidden bg-white/60 max-h-48 overflow-y-auto">
                      {filteredUsers.map(u => (
                        <button key={u.id} onClick={() => { setSelectedRecipient(u); setUserSearch(''); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-rose/5 transition-colors text-left">
                          <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center text-rose font-bold text-xs overflow-hidden shrink-0">
                            {(u as any).avatar ? <img src={(u as any).avatar} className="w-full h-full object-cover" alt="" /> : u.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-charcoal">{u.name}</p>
                            <p className="text-[10px] text-gray-400">{u.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {userSearch && filteredUsers.length === 0 && <p className="text-xs text-gray-400 text-center py-3">No users found</p>}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-rose/10">
                  <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center text-rose font-bold text-xs overflow-hidden shrink-0">
                    {(selectedRecipient as any).avatar ? <img src={(selectedRecipient as any).avatar} className="w-full h-full object-cover" alt="" /> : selectedRecipient.name?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-bold text-charcoal flex-1">{selectedRecipient.name}</p>
                  <button onClick={() => setSelectedRecipient(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>
              )}

              {selectedRecipient && (
                blockedError ? (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                    <p className="text-sm font-bold text-red-500">Message blocked</p>
                    <p className="text-xs text-red-400 mt-1">{selectedRecipient.name} has rejected your messages too many times.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Message</label>
                      <textarea autoFocus value={dmText} onChange={e => { if (e.target.value.length <= 200) setDmText(e.target.value); }}
                        placeholder={`Write to ${selectedRecipient.name?.split(' ')[0]}...`} rows={5}
                        className="w-full px-4 py-3 border border-rose/20 rounded-xl text-sm text-charcoal outline-none focus:ring-2 focus:ring-rose resize-none bg-white/60" />
                      <div className="flex justify-between">
                        <span className="text-[10px] text-gray-400">{dmText.length}/200</span>
                        {dmText.length > 160 && <span className="text-[10px] text-amber-500 font-bold">{200 - dmText.length} left</span>}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowCompose(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50">Cancel</button>
                      <button onClick={handleSendDM} disabled={sendingDM || !dmText.trim()}
                        className="flex-1 py-3 rounded-xl bg-rose text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
                        <Send size={14} /> {sendingDM ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};