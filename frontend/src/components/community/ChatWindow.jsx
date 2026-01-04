import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { Hash, Users, Pin, Search, Settings, MoreVertical, Loader2 } from 'lucide-react';

// Skeleton loader component for chat messages
const MessageSkeleton = ({ isOwn }) => (
  <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} animate-pulse`}>
    {!isOwn && (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex-shrink-0" />
    )}
    <div className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
      {!isOwn && <div className="h-3 w-20 bg-gray-200 rounded" />}
      <div className={`rounded-2xl px-4 py-3 ${isOwn ? 'bg-gradient-to-r from-indigo-100 to-purple-100' : 'bg-white border border-gray-100'}`}>
        <div className="space-y-2">
          <div className={`h-3 ${isOwn ? 'w-32' : 'w-48'} bg-gray-200 rounded`} />
          <div className={`h-3 ${isOwn ? 'w-24' : 'w-36'} bg-gray-200 rounded`} />
        </div>
      </div>
      <div className="h-2 w-12 bg-gray-100 rounded mt-1" />
    </div>
  </div>
);

// Animated loading component
const ChatLoadingSkeleton = () => (
  <div className="flex-1 flex flex-col px-4 py-4 space-y-6 bg-gray-50 overflow-hidden">
    {/* Animated gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20 pointer-events-none" />
    
    {/* Date separator skeleton */}
    <div className="flex items-center gap-4 my-2 animate-pulse">
      <div className="flex-1 h-px bg-gray-200"></div>
      <div className="h-4 w-28 bg-gray-200 rounded-full"></div>
      <div className="flex-1 h-px bg-gray-200"></div>
    </div>
    
    {/* Message skeletons with staggered animation */}
    <div className="space-y-4">
      <div style={{ animationDelay: '0ms' }}>
        <MessageSkeleton isOwn={false} />
      </div>
      <div style={{ animationDelay: '100ms' }}>
        <MessageSkeleton isOwn={false} />
      </div>
      <div style={{ animationDelay: '200ms' }}>
        <MessageSkeleton isOwn={true} />
      </div>
      <div style={{ animationDelay: '300ms' }}>
        <MessageSkeleton isOwn={false} />
      </div>
      <div style={{ animationDelay: '400ms' }}>
        <MessageSkeleton isOwn={true} />
      </div>
    </div>
    
    {/* Floating loading indicator */}
    <div className="flex justify-center mt-4">
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-100">
        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        <span className="text-sm text-gray-600 font-medium">Loading messages...</span>
        <div className="flex gap-1 ml-1">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  </div>
);

export default function ChatWindow({ channel, messages, currentUser, onOptimisticMessage, onOptimisticReaction, onOptimisticEdit, onOptimisticDelete, loading }) {
  const { subscribe, startTyping, stopTyping } = useSocket();
  const [typingUsers, setTypingUsers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to typing events
  useEffect(() => {
    const channelId = channel.id || channel._id;
    
    const unsubTyping = subscribe('user_typing', ({ channelId: typingChannelId, user }) => {
      if (typingChannelId === channelId && user.uid !== currentUser?.uid) {
        setTypingUsers(prev => {
          if (!prev.find(u => u.uid === user.uid)) {
            return [...prev, user];
          }
          return prev;
        });
      }
    });

    const unsubStoppedTyping = subscribe('user_stopped_typing', ({ channelId: typingChannelId, user }) => {
      if (typingChannelId === channelId) {
        setTypingUsers(prev => prev.filter(u => u.uid !== user.uid));
      }
    });

    return () => {
      unsubTyping();
      unsubStoppedTyping();
    };
  }, [subscribe, channel.id, channel._id, currentUser]);

  // Clear typing users after 3 seconds
  useEffect(() => {
    if (typingUsers.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsers([]);
      }, 3000);
    }
    return () => clearTimeout(typingTimeoutRef.current);
  }, [typingUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = useCallback(() => {
    const channelId = channel.id || channel._id;
    startTyping(channelId);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(channelId);
    }, 2000);
  }, [channel.id, channel._id, startTyping, stopTyping]);

  // Filter messages based on search
  const filteredMessages = searchQuery
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Group messages by date
  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Channel Header */}
      <div className="h-14 px-4 border-b bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">{channel.icon || '💬'}</span>
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              {channel.name}
              {channel.type === 'private' && (
                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  Private
                </span>
              )}
            </h2>
            {channel.description && (
              <p className="text-xs text-gray-500 truncate max-w-md">
                {channel.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${
              showSearch ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Pin className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Users className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b bg-gray-50">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            autoFocus
          />
        </div>
      )}

      {/* Messages Area */}
      {loading ? (
        <ChatLoadingSkeleton />
      ) : (
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50"
        >
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-medium">{date}</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Messages */}
              {dateMessages.map((message, index) => {
                const prevMessage = dateMessages[index - 1];
                const showAvatar = !prevMessage || 
                  prevMessage.sender.uid !== message.sender.uid ||
                  new Date(message.createdAt) - new Date(prevMessage.createdAt) > 5 * 60 * 1000;
                
                const messageId = message.id || message._id;
                const channelId = channel.id || channel._id;
                
                return (
                  <MessageBubble
                    key={messageId}
                    message={message}
                    isOwn={message.sender.uid === currentUser?.uid}
                    showAvatar={showAvatar}
                    channelId={channelId}
                    onOptimisticReaction={onOptimisticReaction}
                    onOptimisticEdit={onOptimisticEdit}
                    onOptimisticDelete={onOptimisticDelete}
                  />
                );
              })}
            </div>
          ))}

          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <span className="text-4xl mb-3 block">{channel.icon || '💬'}</span>
                <h3 className="font-medium">Welcome to #{channel.name}</h3>
                <p className="text-sm mt-1">{channel.description || 'Start the conversation!'}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 bg-white border-t">
          <span className="inline-flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
            {typingUsers.length === 1 
              ? `${typingUsers[0].name} is typing...`
              : `${typingUsers.map(u => u.name).join(', ')} are typing...`
            }
          </span>
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        channelId={channel.id || channel._id}
        channelName={channel.name}
        onTyping={handleTyping}
        onOptimisticMessage={onOptimisticMessage}
        currentUser={currentUser}
      />
    </div>
  );
}
