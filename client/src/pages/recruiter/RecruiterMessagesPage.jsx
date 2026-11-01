import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Search,
  CheckCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import {
  fetchRecruiterConversations,
  fetchRecruiterThread,
  sendRecruiterMessageApi,
} from '../../services/recruiterMessageService';

const RecruiterMessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');

  const loadConversations = () => {
    setLoading(true);
    fetchRecruiterConversations()
      .then((data) => {
        const list = data || [];
        setConversations(list);
        if (list.length > 0 && !selectedCandidateId) {
          setSelectedCandidateId(list[0].candidateId);
        }
      })
      .catch(() => setToast({ type: 'error', message: 'Failed to load conversations.' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedCandidateId) return;
    setThreadLoading(true);
    fetchRecruiterThread(selectedCandidateId)
      .then((data) => setThread(data))
      .catch(() => setToast({ type: 'error', message: 'Failed to load message thread.' }))
      .finally(() => setThreadLoading(false));
  }, [selectedCandidateId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedCandidateId) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      await sendRecruiterMessageApi(selectedCandidateId, textToSend);
      // Reload thread
      const updated = await fetchRecruiterThread(selectedCandidateId);
      setThread(updated);
      loadConversations();
    } catch {
      setToast({ type: 'error', message: 'Failed to send message.' });
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.candidateName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast {...toast} onClose={() => setToast(null)} />
        </div>
      )}

      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Candidate Messaging
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Direct communication with shortlisted applicants, technical interview candidates, and talent prospects.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton className="h-[600px] rounded-3xl" />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No Active Conversations"
          description="Candidates who apply to your jobs will appear here for direct outreach and interview discussions."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] min-h-[620px] rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* CONVERSATION LIST */}
          <div className="border-r border-slate-100 flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate name..."
                    className="w-full rounded-2xl bg-slate-50 pl-10 pr-4 py-2 text-xs border border-slate-200 focus:outline-none focus:border-brand-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
                {filteredConversations.map((conv) => {
                  const isSelected = conv.candidateId === selectedCandidateId;

                  return (
                    <button
                      key={conv.candidateId}
                      onClick={() => setSelectedCandidateId(conv.candidateId)}
                      className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                        isSelected ? 'bg-brand-50/80 border-r-4 border-brand-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <Avatar name={conv.candidateName} size="md" className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {conv.candidateName}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {conv.lastMessage || 'Click to view conversation'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ACTIVE THREAD */}
          <div className="flex flex-col justify-between h-full bg-slate-50/40">
            {threadLoading ? (
              <div className="p-8">
                <LoadingSkeleton className="h-96" />
              </div>
            ) : thread ? (
              <>
                {/* THREAD HEADER */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 px-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar name={thread.candidateName} size="sm" />
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        {thread.candidateName}
                      </h3>
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified Applicant
                      </p>
                    </div>
                  </div>
                </div>

                {/* MESSAGES BUBBLES */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[460px]">
                  {(!thread.messages || thread.messages.length === 0) ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No messages in this thread yet. Send a greeting to initiate discussion.
                    </div>
                  ) : (
                    thread.messages.map((msg, index) => {
                      const isMe = msg.senderId && !msg.senderId.startsWith('st_') && msg.senderId !== thread.candidateId;

                      return (
                        <div
                          key={msg.id || index}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-md rounded-2xl p-3.5 text-sm shadow-sm ${
                              isMe
                                ? 'bg-brand-600 text-white rounded-br-none'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                            }`}
                          >
                            <p className="leading-relaxed">{msg.text}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sent'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* INPUT BAR */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-slate-200 bg-white p-4 flex items-center gap-3"
                >
                  <input
                    type="text"
                    placeholder="Type a message to the candidate..."
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:bg-white"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    icon={Send}
                    isLoading={sending}
                    disabled={!inputText.trim()}
                  >
                    Send
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-12 text-slate-400 text-sm">
                Select a candidate from the left pane to view conversation.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterMessagesPage;

