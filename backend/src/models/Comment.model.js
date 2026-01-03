import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
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
    avatar: String
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  likes: [{
    uid: String,
    name: String
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  replyCount: {
    type: Number,
    default: 0
  },
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
commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ 'author.uid': 1 });

// Update like count before saving
commentSchema.pre('save', function() {
  this.likeCount = this.likes.length;
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
