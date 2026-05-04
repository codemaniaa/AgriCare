import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { chatAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useConversations, useMessages } from '../hooks';
import { useWebSocketChat } from '../hooks/useWebSocketChat';
import Navbar from '../components/layout/Navbar';
import { Spinner } from '../components/common';
import { BottomNav } from '../components/layout/SubNavbar';

import { FiSend } from 'react-icons/fi';
import { BsImage } from 'react-icons/bs';

const AVATAR_COLORS = ['bg-blue-500','bg-pink-500','bg-orange-500','bg-purple-500','bg-teal-500'];

export function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { convs, loading: convsLoading, refetch: refetchConvs } = useConversations();
  const [activeConvId, setActiveConvId] = useState(location.state?.convId || null);
  const { messages, loading: msgsLoading, addMessage } = useMessages(activeConvId);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { if (!user) navigate('/signin'); }, [user]);
  useEffect(() => { if (!activeConvId && convs.length > 0) setActiveConvId(convs[0].id); }, [convs]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleWsMessage = useCallback((data) => {
    if (data.sender !== user?.username) {
      addMessage({
        id: data.id,
        sender_name: data.sender,
        content: data.message,
        created_at: data.created_at,
        is_read: false
      });
      refetchConvs();
    }
  }, [user?.username]);

  const { sendMessage: wsSend, connected: wsConnected } = useWebSocketChat(activeConvId, handleWsMessage);

  const activeConv = convs.find((c) => c.id === activeConvId);

  const sendMsg = async () => {
    const content = text.trim();
    if (!content || !activeConvId) return;

    addMessage({
      id: Date.now(),
      sender_name: user.username,
      content,
      created_at: new Date().toISOString(),
      is_read: true
    });

    setText('');
    const sent = wsSend(content);

    if (!sent) {
      setSending(true);
      try {
        const fd = new FormData();
        fd.append('content', content);
        await chatAPI.sendMessage(activeConvId, fd);
      } catch {
        setText(content);
      } finally {
        setSending(false);
      }
    }

    refetchConvs();
  };

  const getAvatarColor = (id=0) => AVATAR_COLORS[id % AVATAR_COLORS.length];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 font-inter">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl shadow-lg flex h-[85vh] overflow-hidden">

          {/* SIDEBAR */}
          <div className="hidden md:flex w-80 border-r flex-col bg-white">
            <div className="p-4 font-semibold text-lg">Messages</div>

            <div className="overflow-y-auto flex-1">
              {convs.map((c) => {
                const isActive = c.id === activeConvId;
                const other = c.other_user;

                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition ${
                      isActive ? 'bg-green-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(other?.id)}`}>
                      {other?.username?.[0]?.toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {other?.full_name || other?.username}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {c.last_message?.content || 'Start chat'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 flex flex-col">

            {/* HEADER */}
            <div className="p-4 border-b flex justify-between items-center bg-white">
              {activeConv && (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(activeConv.other_user?.id)}`}>
                      {activeConv.other_user?.username?.[0]?.toUpperCase()}
                    </div>

                    <div>
                      <div className="font-semibold">
                        {activeConv.other_user?.full_name || activeConv.other_user?.username}
                      </div>
                      <div className="text-xs text-gray-400">
                        {wsConnected ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/profile/${activeConv.other_user?.username}`)}
                    className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-full hover:bg-green-700 transition"
                  >
                    View Profile
                  </button>
                </>
              )}
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-green-50 via-white to-green-100">
              {messages.map((m, idx) => {
                const isMe = m.sender_name === user?.username;
                const showDate =
                  idx === 0 ||
                  new Date(m.created_at).toDateString() !==
                  new Date(messages[idx - 1]?.created_at).toDateString();

                return (
                  <React.Fragment key={m.id}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-500 my-2">
                        {new Date(m.created_at).toDateString()}
                      </div>
                    )}
                    
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl max-w-xs text-sm shadow ${
                          isMe
                            ? 'bg-green-600 text-white rounded-br-none'
                            : 'bg-white border rounded-bl-none'
                        }`}
                      >
                        {m.content}
                        <div className="text-[10px] mt-1 opacity-70 text-right">
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {isMe && <span className="ml-1">✓</span>}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            <div className="p-3 border-t flex items-center gap-2 bg-white">
              <button className="text-gray-500 hover:text-green-600 text-xl">
                <BsImage />
              </button>

              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Type a message..."
              />

              <button
                onClick={sendMsg}
                disabled={!text.trim()}
                className={`p-2 rounded-full text-white transition ${
                  text.trim()
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
              <FiSend />
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
 