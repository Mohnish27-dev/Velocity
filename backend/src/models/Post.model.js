import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    uid: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: String,
    avatar: String,
    jobRole: String
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['experience', 'interview', 'tips', 'question', 'success-story', 'resource', 'discussion', 'other'],
    default: 'discussion'
  },
  likes: [{
    uid: String,
    name: String,
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    type: String  // UIDs
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  attachments: [{
    url: String,
    type: String,
    name: String
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
postSchema.index({ createdAt: -1 });
postSchema.index({ 'author.uid': 1 });
postSchema.index({ category: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', content: 'text' });

// Update like count before saving
postSchema.pre('save', function() {
  this.likeCount = this.likes.length;
});

const Post = mongoose.model('Post', postSchema);

export default Post;
