import { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { 
  MoreHorizontal, 
  Reply, 
  Smile, 
  Edit2, 
  Trash2, 
  Pin,
  Copy,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥', '👏'];

export default function MessageBubble({ message, isOwn, showAvatar, channelId }) {
  const { addReaction, removeReaction, editMessage, deleteMessage } = useSocket();
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);

  const handleReaction = (emoji) => {
    const hasReacted = message.reactions?.some(
      r => r.emoji === emoji && r.users.some(u => u.uid === user?.uid)
    );

    if (hasReacted) {
      removeReaction(message._id, emoji);
    } else {
      addReaction(message._id, emoji);
    }
    setShowReactions(false);
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      editMessage(message._id, editContent);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessage(message._id);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  const formattedTime = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  if (message.isDeleted) {
    return (
      <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <div className="w-8" />
        <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-400 italic text-sm">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`group flex gap-3 hover:bg-gray-100/50 -mx-2 px-2 py-1 rounded-lg ${
        isOwn ? 'flex-row-reverse' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* Avatar */}
      {showAvatar ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
          {message.sender.avatar ? (
            <img 
              src={message.sender.avatar} 
              alt={message.sender.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(message.sender.name)
          )}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isOwn ? 'text-right' : ''}`}>
        {showAvatar && (
          <div className={`flex items-baseline gap-2 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <span className="font-medium text-sm text-gray-900">
              {message.sender.name}
            </span>
            <span className="text-xs text-gray-400">{formattedTime}</span>
          </div>
        )}

        {/* Reply Preview */}
        {message.replyToPreview && (
          <div className={`mb-1 ${isOwn ? 'ml-auto' : 'mr-auto'} max-w-sm`}>
            <div className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 border-l-2 border-indigo-400">
              <span className="font-medium">{message.replyToPreview.senderName}</span>
              <p className="truncate">{message.replyToPreview.content}</p>
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`relative inline-block ${isOwn ? 'text-left' : ''}`}>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div
              className={`rounded-2xl px-4 py-2 max-w-lg ${
                isOwn 
                  ? 'bg-indigo-600 text-white rounded-br-md' 
                  : 'bg-white border rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-sm">
                {message.content}
              </p>
              {message.isEdited && (
                <span className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                  (edited)
                </span>
              )}
            </div>
          )}

          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="inline-block">
                  {attachment.type?.startsWith('image/') ? (
                    <img 
                      src={attachment.url} 
                      alt={attachment.name}
                      className="max-w-xs rounded-lg"
                    />
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
                    >
                      📎 {attachment.name}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions?.length > 0 && (
            <div className={`flex gap-1 mt-1 flex-wrap ${isOwn ? 'justify-end' : ''}`}>
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                    reaction.users.some(u => u.uid === user?.uid)
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.users.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {showActions && !isEditing && (
            <div 
              className={`absolute ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-0 px-2`}
            >
              <div className="flex items-center gap-1 bg-white border rounded-lg shadow-sm p-1">
                {/* Quick Reaction */}
                <div className="relative">
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {showReactions && (
                    <div className="absolute bottom-full mb-1 left-0 bg-white border rounded-lg shadow-lg p-1 flex gap-1">
                      {QUICK_REACTIONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(emoji)}
                          className="p-1 hover:bg-gray-100 rounded text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply */}
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                  <Reply className="w-4 h-4" />
                </button>

                {/* Copy */}
                <button 
                  onClick={handleCopy}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>

                {/* Edit & Delete (only for own messages) */}
                {isOwn && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
