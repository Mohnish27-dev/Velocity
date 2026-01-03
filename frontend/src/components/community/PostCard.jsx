import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Flag
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PostCard({ post, currentUser, onLike, onDelete, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const navigate = useNavigate();

  const isOwn = post.author.uid === currentUser?.uid;
  const isLiked = post.likes?.some(l => l.uid === currentUser?.uid);
  const contentPreviewLength = 300;
  const shouldTruncate = post.content.length > contentPreviewLength;

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  const getCategoryStyle = (category) => {
    const styles = {
      experience: 'bg-blue-100 text-blue-700',
      interview: 'bg-purple-100 text-purple-700',
      tips: 'bg-yellow-100 text-yellow-700',
      question: 'bg-green-100 text-green-700',
      'success-story': 'bg-pink-100 text-pink-700',
      resource: 'bg-orange-100 text-orange-700',
      discussion: 'bg-gray-100 text-gray-700',
    };
    return styles[category] || styles.discussion;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      experience: '💼',
      interview: '🎤',
      tips: '💡',
      question: '❓',
      'success-story': '🎉',
      resource: '📚',
      discussion: '💬',
    };
    return icons[category] || '💬';
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.content.substring(0, 100) + '...',
        url: window.location.origin + `/community/post/${post._id}`
      });
    } catch {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.origin + `/community/post/${post._id}`);
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Author Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {post.author.avatar ? (
                <img 
                  src={post.author.avatar} 
                  alt={post.author.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(post.author.name)
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{post.author.name}</span>
                {post.author.jobRole && (
                  <span className="text-xs text-gray-500">• {post.author.jobRole}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                {post.isEdited && <span>• edited</span>}
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.views || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg py-1 z-10">
                {isOwn ? (
                  <>
                    <button
                      onClick={() => {
                        onEdit?.(post);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Post
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this post?')) {
                          onDelete(post._id);
                        }
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Post
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Flag className="w-4 h-4" />
                    Report Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category Badge */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(post.category)}`}>
            {getCategoryIcon(post.category)}
            {post.category?.replace('-', ' ')}
          </span>
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              📌 Pinned
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {post.title}
        </h3>
        
        <div className="prose prose-sm max-w-none text-gray-600">
          {shouldTruncate && !showFullContent ? (
            <>
              <ReactMarkdown>
                {post.content.substring(0, contentPreviewLength) + '...'}
              </ReactMarkdown>
              <button
                onClick={() => setShowFullContent(true)}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                Read more
              </button>
            </>
          ) : (
            <ReactMarkdown>{post.content}</ReactMarkdown>
          )}
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Attachments */}
      {post.attachments?.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            {post.attachments.map((att, index) => (
              <div key={index} className="flex-shrink-0">
                {att.type?.startsWith('image/') ? (
                  <img 
                    src={att.url} 
                    alt={att.name}
                    className="max-h-48 rounded-lg"
                  />
                ) : (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
                  >
                    📎 {att.name}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={() => onLike(post._id)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{post.likeCount || 0}</span>
          </button>

          {/* Comments */}
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600">
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentCount || 0}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Bookmark */}
        <button className="text-gray-400 hover:text-indigo-600">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}
