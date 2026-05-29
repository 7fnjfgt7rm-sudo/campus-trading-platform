import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import './Chat.css';

function Chat() {
  const { userId } = useParams();
  const { user } = useContext(AuthContext);
  const {
    conversations,
    currentChat,
    messages,
    fetchConversations,
    fetchMessages,
    sendMessage,
    isOnline,
    setCurrentChat
  } = useContext(ChatContext);

  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
      setCurrentChat({ userId: parseInt(userId) });
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChat) return;

    sendMessage(currentChat.userId, messageInput.trim());
    setMessageInput('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUsername?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>消息</h2>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="搜索聊天..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chat-search-input"
          />
        </div>
        <div className="conversations-list">
          {filteredConversations.length === 0 ? (
            <div className="empty-conversations">
              <p>{searchQuery ? '没有找到匹配的聊天' : '暂无消息记录'}</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <Link
                key={conv.otherUserId}
                to={`/chat/${conv.otherUserId}`}
                className={`conversation-item ${currentChat?.userId === conv.otherUserId ? 'active' : ''}`}
              >
                <div className="conversation-avatar">
                  {conv.otherUsername?.charAt(0).toUpperCase()}
                  {isOnline(conv.otherUserId) && <span className="online-indicator" />}
                </div>
                <div className="conversation-content">
                  <div className="conversation-header">
                    <span className="conversation-name">{conv.otherUsername}</span>
                    <span className="conversation-time">
                      {new Date(conv.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="conversation-preview">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="unread-badge">{conv.unreadCount}</span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {currentChat && messages.length >= 0 ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-user-avatar">
                  {conversations.find(c => c.otherUserId === currentChat.userId)?.otherUsername?.charAt(0).toUpperCase() || '?'}
                  {isOnline(currentChat.userId) && <span className="online-indicator" />}
                </div>
                <span className="chat-user-name">
                  {conversations.find(c => c.otherUserId === currentChat.userId)?.otherUsername || '用户'}
                </span>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message ${msg.senderId === user?.id ? 'message-sent' : 'message-received'}`}
                >
                  <div className="message-content">
                    <p>{msg.message}</p>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input-container" onSubmit={handleSend}>
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入消息..."
                className="message-input"
              />
              <button
                type="submit"
                className="send-btn"
                disabled={!messageInput.trim()}
              >
                发送
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <h3>欢迎来到消息中心</h3>
            <p>选择一个聊天开始对话，或浏览商品联系卖家</p>
            <Link to="/search" className="btn btn-primary">
              浏览商品
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;