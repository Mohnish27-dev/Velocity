import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { communityApi } from '../services/api';
import Layout from '../components/Layout';
import ChannelList from '../components/community/ChannelList';
import ChatWindow from '../components/community/ChatWindow';
import MembersList from '../components/community/MembersList';
import PostsFeed from '../components/community/PostsFeed';
import DirectMessages from '../components/community/DirectMessages';
import { 
  MessageSquare, 
  Users, 
  FileText, 
  Mail, 
  Menu, 
  X,
  Plus,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Community() {
  const { user } = useAuth();
  const { isConnected, onlineUsers, subscribe, joinChannel, leaveChannel } = useSocket();
  
  // View state
  const [activeView, setActiveView] = useState('channels'); // channels, posts, dms
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(true);
  
  // Channel state
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  
  // Modal state
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  // Fetch channels on mount
  useEffect(() => {
    fetchChannels();
  }, []);

  // Subscribe to socket events
  useEffect(() => {
    const unsubNewMessage = subscribe('new_message', handleNewMessage);
    const unsubChannelMessages = subscribe('channel_messages', handleChannelMessages);
    const unsubNewChannel = subscribe('new_channel', handleNewChannel);
    const unsubMessageEdited = subscribe('message_edited', handleMessageEdited);
    const unsubMessageDeleted = subscribe('message_deleted', handleMessageDeleted);
    const unsubReactionUpdated = subscribe('message_reaction_updated', handleReactionUpdated);

    return () => {
      unsubNewMessage();
      unsubChannelMessages();
      unsubNewChannel();
      unsubMessageEdited();
      unsubMessageDeleted();
      unsubReactionUpdated();
    };
  }, [subscribe]);

  // Join channel when selected
  useEffect(() => {
    if (activeChannel) {
      joinChannel(activeChannel._id);
      return () => leaveChannel(activeChannel._id);
    }
  }, [activeChannel, joinChannel, leaveChannel]);

  const fetchChannels = async () => {
    try {
      setLoadingChannels(true);
      const data = await communityApi.getChannels();
      setChannels(data.channels);
      // Auto-select first channel
      if (data.channels.length > 0 && !activeChannel) {
        setActiveChannel(data.channels[0]);
      }
    } catch (error) {
      toast.error('Failed to load channels');
    } finally {
      setLoadingChannels(false);
    }
  };

  // Socket event handlers
  const handleNewMessage = useCallback((data) => {
    if (data.channelId === activeChannel?._id) {
      setMessages(prev => [...prev, data]);
    }
    // Update channel's last message
    setChannels(prev => prev.map(ch => 
      ch._id === data.channelId 
        ? { ...ch, lastMessage: { content: data.content, senderName: data.sender.name, timestamp: data.createdAt } }
        : ch
    ));
  }, [activeChannel]);

  const handleChannelMessages = useCallback((data) => {
    if (data.channelId === activeChannel?._id) {
      setMessages(data.messages);
    }
  }, [activeChannel]);

  const handleNewChannel = useCallback(({ channel }) => {
    setChannels(prev => [...prev, channel]);
  }, []);

  const handleMessageEdited = useCallback(({ messageId, content, editedAt }) => {
    setMessages(prev => prev.map(msg => 
      msg._id === messageId ? { ...msg, content, isEdited: true, editedAt } : msg
    ));
  }, []);

  const handleMessageDeleted = useCallback(({ messageId }) => {
    setMessages(prev => prev.filter(msg => msg._id !== messageId));
  }, []);

  const handleReactionUpdated = useCallback(({ messageId, reactions }) => {
    setMessages(prev => prev.map(msg => 
      msg._id === messageId ? { ...msg, reactions } : msg
    ));
  }, []);

  const handleChannelSelect = (channel) => {
    if (activeChannel?._id !== channel._id) {
      setActiveChannel(channel);
      setMessages([]);
    }
  };

  const handleCreateChannel = async (channelData) => {
    try {
      const data = await communityApi.createChannel(channelData);
      setChannels(prev => [...prev, data.channel]);
      setActiveChannel(data.channel);
      setShowCreateChannel(false);
      toast.success('Channel created!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-64px)] flex bg-gray-50">
        {/* Left Sidebar - Channels/Navigation */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r flex flex-col transition-all duration-300 overflow-hidden`}>
          {/* View Tabs */}
          <div className="p-3 border-b">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveView('channels')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'channels' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden lg:inline">Chat</span>
              </button>
              <button
                onClick={() => setActiveView('posts')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'posts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden lg:inline">Posts</span>
              </button>
              <button
                onClick={() => setActiveView('dms')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'dms' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span className="hidden lg:inline">DMs</span>
              </button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="px-4 py-2 border-b">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
              <span className="text-gray-400 ml-auto">{onlineUsers.length} online</span>
            </div>
          </div>

          {/* Channel List or DM List */}
          <div className="flex-1 overflow-y-auto">
            {activeView === 'channels' && (
              <ChannelList
                channels={channels}
                activeChannel={activeChannel}
                onSelectChannel={handleChannelSelect}
                onCreateChannel={() => setShowCreateChannel(true)}
                loading={loadingChannels}
              />
            )}
            {activeView === 'dms' && (
              <DirectMessages />
            )}
          </div>
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-r-lg p-1.5 shadow-md hover:bg-gray-50 lg:hidden"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeView === 'channels' && activeChannel ? (
            <ChatWindow
              channel={activeChannel}
              messages={messages}
              currentUser={user}
            />
          ) : activeView === 'posts' ? (
            <PostsFeed />
          ) : activeView === 'dms' ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a channel to start chatting</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Members */}
        {activeView === 'channels' && (
          <div className={`${membersOpen ? 'w-60' : 'w-0'} bg-white border-l transition-all duration-300 overflow-hidden hidden lg:block`}>
            <MembersList
              channel={activeChannel}
              onlineUsers={onlineUsers}
            />
          </div>
        )}

        {/* Members Toggle */}
        {activeView === 'channels' && (
          <button
            onClick={() => setMembersOpen(!membersOpen)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-l-lg p-1.5 shadow-md hover:bg-gray-50 hidden lg:block"
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        {/* Create Channel Modal */}
        {showCreateChannel && (
          <CreateChannelModal
            onClose={() => setShowCreateChannel(false)}
            onCreate={handleCreateChannel}
          />
        )}
      </div>
    </Layout>
  );
}

// Create Channel Modal Component
function CreateChannelModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [type, setType] = useState('public');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await onCreate({ name, description, category, type });
    setLoading(false);
  };

  const categories = [
    { value: 'general', label: '💬 General' },
    { value: 'job-hunting', label: '🔍 Job Hunting' },
    { value: 'interview-prep', label: '🎯 Interview Prep' },
    { value: 'resume-tips', label: '📄 Resume Tips' },
    { value: 'networking', label: '🤝 Networking' },
    { value: 'other', label: '📌 Other' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create Channel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., frontend-devs"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="public"
                  checked={type === 'public'}
                  onChange={(e) => setType(e.target.value)}
                  className="text-indigo-600"
                />
                <span className="text-sm">Public</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="private"
                  checked={type === 'private'}
                  onChange={(e) => setType(e.target.value)}
                  className="text-indigo-600"
                />
                <span className="text-sm">Private</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
