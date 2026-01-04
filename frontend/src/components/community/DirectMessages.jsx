import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { communityApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { Search, Plus, Circle, X } from 'lucide-react';

export default function DirectMessages() {
  const { user } = useAuth();
  const { subscribe, onlineUsers, startConversation } = useSocket();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDM, setShowNewDM] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Subscribe to new DMs
  useEffect(() => {
    const unsubNewDM = subscribe('new_direct_message', ({ message, conversation }) => {
      const convId = conversation.id || conversation._id;
      // Update conversations list
      setConversations(prev => {
        const exists = prev.find(c => (c.id || c._id) === convId);
        if (exists) {
          return prev.map(c => (c.id || c._id) === convId ? conversation : c);
        }
        return [conversation, ...prev];
      });

      // Update messages if viewing this conversation
      const selectedId = selectedConversation?.id || selectedConversation?._id;
      if (selectedId === convId) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => unsubNewDM();
  }, [subscribe, selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await communityApi.getConversations();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const data = await communityApi.getConversationMessages(conversationId);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSelectConversation = (conv) => {
    const convId = conv.id || conv._id;
    setSelectedConversation(conv);
    fetchMessages(convId);
  };

  const handleStartConversation = (targetUser) => {
    startConversation({
      receiverId: targetUser.uid,
      receiverName: targetUser.name,
      receiverEmail: targetUser.email
    });
    setShowNewDM(false);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  // Filter online users for new DM
  const filteredUsers = onlineUsers.filter(u => 
    u.uid !== user?.uid &&
    (searchQuery === '' || u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Direct Messages</h3>
        <button
          onClick={() => setShowNewDM(true)}
          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded" />
                  <div className="w-32 h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div className="py-2">
            {conversations.map(conv => {
              const convId = conv.id || conv._id;
              const selectedId = selectedConversation?.id || selectedConversation?._id;
              const otherUser = conv.otherParticipant;
              const isOnline = conv.isOnline;
              const unreadCount = conv.unreadCount || 0;

              return (
                <button
                  key={convId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedId === convId ? 'bg-indigo-50' : ''
                  }`}
                >
                  {/* Avatar with online status */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {otherUser?.avatar ? (
                        <img 
                          src={otherUser.avatar} 
                          alt={otherUser.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(otherUser?.name)
                      )}
                    </div>
                    <span 
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 truncate">
                        {otherUser?.name}
                      </span>
                      {conv.lastMessage?.timestamp && (
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conv.lastMessage.timestamp), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage?.senderId === user?.uid && 'You: '}
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p className="text-sm">No conversations yet</p>
            <button
              onClick={() => setShowNewDM(true)}
              className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              Start a conversation
            </button>
          </div>
        )}
      </div>

      {/* New DM Modal */}
      {showNewDM && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">New Message</h3>
              <button
                onClick={() => setShowNewDM(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Online Users */}
              <div className="max-h-64 overflow-y-auto">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Online Users
                </p>
                {filteredUsers.length > 0 ? (
                  <div className="space-y-1">
                    {filteredUsers.map(u => (
                      <button
                        key={u.uid}
                        onClick={() => handleStartConversation(u)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                            {getInitials(u.name)}
                          </div>
                          <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-500 fill-green-500" />
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No users found
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
