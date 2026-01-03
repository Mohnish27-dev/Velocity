import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  category: {
    type: String,
    enum: ['general', 'job-hunting', 'interview-prep', 'resume-tips', 'networking', 'announcements', 'other'],
    default: 'general'
  },
  createdBy: {
    type: String,  // Firebase UID
    required: true
  },
  createdByName: {
    type: String,
    required: true
  },
  members: [{
    uid: String,
    name: String,
    email: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    }
  }],
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  lastMessage: {
    content: String,
    senderName: String,
    timestamp: Date
  },
  memberCount: {
    type: Number,
    default: 0
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: '💬'
  }
}, {
  timestamps: true
});

// Index for faster queries
channelSchema.index({ type: 1, createdAt: -1 });
channelSchema.index({ 'members.uid': 1 });
channelSchema.index({ name: 'text', description: 'text' });

// Update member count before saving
channelSchema.pre('save', function() {
  this.memberCount = this.members.length;
});

const Channel = mongoose.model('Channel', channelSchema);

export default Channel;
