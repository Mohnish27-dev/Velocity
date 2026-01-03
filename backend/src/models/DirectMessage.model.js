import mongoose from 'mongoose';

// Conversation schema for DM threads
const conversationSchema = new mongoose.Schema({
  participants: [{
    uid: {
      type: String,
      required: true
    },
    name: String,
    email: String,
    avatar: String
  }],
  lastMessage: {
    content: String,
    senderId: String,
    senderName: String,
    timestamp: Date,
    isRead: {
      type: Boolean,
      default: false
    }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for finding conversations by participants
conversationSchema.index({ 'participants.uid': 1 });
conversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

// Direct message schema
const directMessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    uid: {
      type: String,
      required: true
    },
    name: String,
    email: String,
    avatar: String
  },
  receiver: {
    uid: {
      type: String,
      required: true
    },
    name: String
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  attachments: [{
    url: String,
    type: String,
    name: String,
    size: Number
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
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
directMessageSchema.index({ conversation: 1, createdAt: -1 });
directMessageSchema.index({ 'sender.uid': 1 });
directMessageSchema.index({ 'receiver.uid': 1 });

const DirectMessage = mongoose.model('DirectMessage', directMessageSchema);

export { Conversation, DirectMessage };
