import { useState, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { 
  Send, 
  Smile, 
  Paperclip, 
  AtSign, 
  Hash,
  X,
  Image as ImageIcon
} from 'lucide-react';

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '💯', '🚀', '✨', '🙌', '💪', '🤔'];

export default function MessageInput({ channelId, channelName, onTyping, replyTo, onCancelReply }) {
  const { sendMessage } = useSocket();
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!content.trim() && attachments.length === 0) return;

    sendMessage({
      channelId,
      content: content.trim(),
      replyTo: replyTo?._id,
      attachments
    });

    setContent('');
    setAttachments([]);
    setShowEmoji(false);
    if (onCancelReply) onCancelReply();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e) => {
    setContent(e.target.value);
    onTyping?.();
  };

  const insertEmoji = (emoji) => {
    setContent(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    // For now, just store file names - actual upload would go to your storage
    const newAttachments = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      // In production, you'd upload and get a URL
      url: URL.createObjectURL(file)
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t bg-white">
      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
          <div className="flex-1 text-sm">
            <span className="text-gray-500">Replying to </span>
            <span className="font-medium text-gray-700">{replyTo.sender.name}</span>
            <p className="text-gray-500 truncate">{replyTo.content}</p>
          </div>
          <button 
            onClick={onCancelReply}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-b flex gap-2 flex-wrap">
          {attachments.map((file, index) => (
            <div 
              key={index}
              className="relative group bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2"
            >
              {file.type.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4 text-gray-500" />
              ) : (
                <Paperclip className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm text-gray-700 max-w-[150px] truncate">
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end gap-2">
          {/* Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${channelName}`}
              rows={1}
              className="w-full px-4 py-2.5 pr-24 border rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 max-h-32"
              style={{ minHeight: '44px' }}
            />
            
            {/* Action Buttons inside input */}
            <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
              {/* Emoji Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmoji(!showEmoji)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showEmoji ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Emoji Dropdown */}
                {showEmoji && (
                  <div className="absolute bottom-full right-0 mb-2 bg-white border rounded-xl shadow-lg p-2 w-64">
                    <div className="grid grid-cols-6 gap-1">
                      {EMOJI_LIST.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="p-2 text-xl hover:bg-gray-100 rounded-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mention Button */}
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <AtSign className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!content.trim() && attachments.length === 0}
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
