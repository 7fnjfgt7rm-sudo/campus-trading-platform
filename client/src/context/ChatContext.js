import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const ChatContext = createContext();

import { API_URL, SOCKET_URL } from '../config';

export function ChatProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user?.id) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.emit('join', user.id.toString());

      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('newMessage', (message) => {
        if (currentChat && message.senderId.toString() === currentChat.userId.toString()) {
          setMessages(prev => [...prev, message]);
        }
        fetchConversations();
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, currentChat]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId, productId = null) => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const params = productId ? { productId } : {};
      const response = await axios.get(`${API_URL}/chat/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setMessages(response.data);
      setCurrentChat({ userId: otherUserId });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = (receiverId, message, productId = null) => {
    if (!socket || !user) return;

    const messageData = {
      senderId: user.id,
      receiverId: parseInt(receiverId),
      message,
      productId
    };

    socket.emit('sendMessage', messageData);
    setMessages(prev => [...prev, {
      ...messageData,
      timestamp: new Date().toISOString(),
      senderName: user.username
    }]);
  };

  const isOnline = (userId) => {
    return onlineUsers.includes(userId.toString());
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const value = {
    socket,
    onlineUsers,
    conversations,
    currentChat,
    messages,
    fetchConversations,
    fetchMessages,
    sendMessage,
    isOnline,
    setCurrentChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}