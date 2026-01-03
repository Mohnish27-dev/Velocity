import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  sender: {
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
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system', 'announcement'],
    default: 'text'
  },
  attachments: [{
    url: String,
    type: String,
    name: String,
    size: Number
  }],
  reactions: [{
    emoji: String,
    users: [{
      uid: String,
      name: String
    }]
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  replyToPreview: {
    content: String,
    senderName: String
  },
  mentions: [{
    uid: String,
    name: String
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  deletedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  readBy: [{
    uid: String,
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ 'sender.uid': 1 });
messageSchema.index({ content: 'text' });

const Message = mongoose.model('Message', messageSchema);

export default Message;
