import { useState } from 'react';
import { X, Image as ImageIcon, Link, Hash, Send } from 'lucide-react';

const CATEGORIES = [
  { value: 'discussion', label: '💬 Discussion' },
  { value: 'experience', label: '💼 Experience' },
  { value: 'interview', label: '🎤 Interview' },
  { value: 'tips', label: '💡 Tips & Tricks' },
  { value: 'question', label: '❓ Question' },
  { value: 'success-story', label: '🎉 Success Story' },
  { value: 'resource', label: '📚 Resource' },
];

export default function PostEditor({ onClose, onSubmit, editPost = null }) {
  const [title, setTitle] = useState(editPost?.title || '');
  const [content, setContent] = useState(editPost?.content || '');
  const [category, setCategory] = useState(editPost?.category || 'discussion');
  const [tags, setTags] = useState(editPost?.tags?.join(', ') || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    
    const postData = {
      title: title.trim(),
      content: content.trim(),
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    await onSubmit(postData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-white">
            {editPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                required
                maxLength={200}
              />
              <p className="mt-1 text-xs text-neutral-500 text-right">
                {title.length}/200
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      category === cat.value
                        ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500 ring-offset-1 ring-offset-neutral-900'
                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, experience, or ask a question... (Markdown supported)"
                rows={8}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                required
                maxLength={10000}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-neutral-500">
                  Supports Markdown formatting
                </p>
                <p className="text-xs text-neutral-500">
                  {content.length}/10000
                </p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                <Hash className="w-4 h-4 inline mr-1" />
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Add tags separated by commas (e.g., react, frontend, tips)"
                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Tags help others find your post
              </p>
            </div>

            {/* Preview of tags */}
            {tags && (
              <div className="flex flex-wrap gap-1.5">
                {tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg"
                title="Add image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg"
                title="Add link"
              >
                <Link className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-700 rounded-lg text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !content.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {editPost ? 'Update Post' : 'Publish Post'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
