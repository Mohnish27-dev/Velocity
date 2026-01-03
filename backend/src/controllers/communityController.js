import Channel from '../models/Channel.model.js';
import Message from '../models/Message.model.js';
import Post from '../models/Post.model.js';
import Comment from '../models/Comment.model.js';
import { Conversation, DirectMessage } from '../models/DirectMessage.model.js';
import { presenceService } from '../services/presenceService.js';
import { getIO } from '../config/socket.js';
import { ApiError } from '../middleware/errorHandler.js';

// ============ CHANNEL CONTROLLERS ============

// Get all channels
export const getChannels = async (req, res, next) => {
  try {
    const { type = 'all' } = req.query;
    
    let query = {};
    if (type === 'public') {
      query.type = 'public';
    } else if (type === 'private') {
      query.type = 'private';
      query['members.uid'] = req.user.uid;
    }

    const channels = await Channel.find(query)
      .sort({ isDefault: -1, 'lastMessage.timestamp': -1, createdAt: -1 })
      .lean();

    res.json({ success: true, channels });
  } catch (error) {
    next(error);
  }
};

// Get single channel
export const getChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      throw new ApiError(404, 'Channel not found');
    }

    res.json({ success: true, channel });
  } catch (error) {
    next(error);
  }
};

// Create channel
export const createChannel = async (req, res, next) => {
  try {
    const { name, description, type = 'public', category = 'general', icon } = req.body;

    // Check if channel name exists
    const existing = await Channel.findOne({ name: name.toLowerCase().replace(/\s+/g, '-') });
    if (existing) {
      throw new ApiError(400, 'Channel with this name already exists');
    }

    const channel = new Channel({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      type,
      category,
      icon: icon || '💬',
      createdBy: req.user.uid,
      createdByName: req.user.name,
      members: [{
        uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        role: 'admin'
      }]
    });

    await channel.save();

    // Notify all users about new channel
    try {
      const io = getIO();
      io.emit('new_channel', { channel });
    } catch (e) {
      // Socket might not be initialized yet
    }

    res.status(201).json({ success: true, channel });
  } catch (error) {
    next(error);
  }
};

// Join channel
export const joinChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      throw new ApiError(404, 'Channel not found');
    }

    // Check if already a member
    if (channel.members.some(m => m.uid === req.user.uid)) {
      return res.json({ success: true, message: 'Already a member', channel });
    }

    channel.members.push({
      uid: req.user.uid,
      name: req.user.name,
      email: req.user.email,
      role: 'member'
    });

    await channel.save();

    res.json({ success: true, channel });
  } catch (error) {
    next(error);
  }
};

// Leave channel
export const leaveChannel = async (req, res, next) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      throw new ApiError(404, 'Channel not found');
    }

    if (channel.isDefault) {
      throw new ApiError(400, 'Cannot leave default channel');
    }

    channel.members = channel.members.filter(m => m.uid !== req.user.uid);
    await channel.save();

    res.json({ success: true, message: 'Left channel successfully' });
  } catch (error) {
    next(error);
  }
};

// Get channel messages
export const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    let query = { channel: channelId, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Message.countDocuments({ channel: channelId, isDeleted: false });

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: total > parseInt(page) * parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============ POST CONTROLLERS ============

// Get all posts
export const getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, sortBy = 'latest' } = req.query;

    let query = { isDeleted: false };
    if (category && category !== 'all') {
      query.category = category;
    }

    let sort = { createdAt: -1 };
    if (sortBy === 'popular') {
      sort = { likeCount: -1, createdAt: -1 };
    } else if (sortBy === 'trending') {
      sort = { views: -1, likeCount: -1, createdAt: -1 };
    }

    const posts = await Post.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: total > parseInt(page) * parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single post
export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || post.isDeleted) {
      throw new ApiError(404, 'Post not found');
    }

    // Increment view count
    if (!post.viewedBy.includes(req.user.uid)) {
      post.views += 1;
      post.viewedBy.push(req.user.uid);
      await post.save();
    }

    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// Create post
export const createPost = async (req, res, next) => {
  try {
    const { title, content, tags = [], category = 'discussion', attachments = [] } = req.body;

    const post = new Post({
      title,
      content,
      tags: tags.map(t => t.toLowerCase().trim()),
      category,
      attachments,
      author: {
        uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.picture
      }
    });

    await post.save();

    // Notify subscribers
    try {
      const io = getIO();
      io.to('posts:feed').emit('new_post', { post });
    } catch (e) {
      // Socket might not be initialized
    }

    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// Update post
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    if (post.author.uid !== req.user.uid) {
      throw new ApiError(403, 'Not authorized to edit this post');
    }

    const { title, content, tags, category } = req.body;

    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) post.tags = tags.map(t => t.toLowerCase().trim());
    if (category) post.category = category;
    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// Delete post
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    if (post.author.uid !== req.user.uid) {
      throw new ApiError(403, 'Not authorized to delete this post');
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Like/Unlike post
export const toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    const alreadyLiked = post.likes.some(l => l.uid === req.user.uid);

    if (alreadyLiked) {
      post.likes = post.likes.filter(l => l.uid !== req.user.uid);
    } else {
      post.likes.push({ uid: req.user.uid, name: req.user.name });
    }

    await post.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likeCount: post.likeCount
    });
  } catch (error) {
    next(error);
  }
};

// ============ COMMENT CONTROLLERS ============

// Get comments for a post
export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({ 
      post: postId, 
      isDeleted: false,
      parentComment: null 
    })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentComment: comment._id,
          isDeleted: false
        })
          .sort({ createdAt: 1 })
          .limit(5)
          .lean();
        return { ...comment, replies };
      })
    );

    const total = await Comment.countDocuments({ 
      post: postId, 
      isDeleted: false, 
      parentComment: null 
    });

    res.json({
      success: true,
      comments: commentsWithReplies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create comment
export const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    const comment = new Comment({
      content,
      post: postId,
      author: {
        uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.picture
      },
      parentComment: parentCommentId || null
    });

    await comment.save();

    // Update post comment count
    post.commentCount += 1;
    await post.save();

    // Update parent reply count if it's a reply
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $inc: { replyCount: 1 }
      });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

// Like/Unlike comment
export const toggleLikeComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    const alreadyLiked = comment.likes.some(l => l.uid === req.user.uid);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(l => l.uid !== req.user.uid);
    } else {
      comment.likes.push({ uid: req.user.uid, name: req.user.name });
    }

    await comment.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likeCount: comment.likeCount
    });
  } catch (error) {
    next(error);
  }
};

// ============ DIRECT MESSAGE CONTROLLERS ============

// Get user's conversations
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      'participants.uid': req.user.uid,
      isActive: true
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Add online status to each participant
    const conversationsWithStatus = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants.find(p => p.uid !== req.user.uid);
        const isOnline = await presenceService.isOnline(otherParticipant?.uid);
        return {
          ...conv,
          otherParticipant,
          isOnline,
          unreadCount: conv.unreadCount?.get(req.user.uid) || 0
        };
      })
    );

    res.json({ success: true, conversations: conversationsWithStatus });
  } catch (error) {
    next(error);
  }
};

// Get messages in a conversation
export const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some(p => p.uid === req.user.uid)) {
      throw new ApiError(403, 'Not authorized to view this conversation');
    }

    const messages = await DirectMessage.find({
      conversation: conversationId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    res.json({
      success: true,
      messages: messages.reverse(),
      conversation
    });
  } catch (error) {
    next(error);
  }
};

// ============ PRESENCE CONTROLLER ============

export const getOnlineUsers = async (req, res, next) => {
  try {
    const users = await presenceService.getOnlineUsers();
    const count = await presenceService.getOnlineCount();
    
    res.json({ 
      success: true, 
      users,
      count 
    });
  } catch (error) {
    next(error);
  }
};

// ============ SEARCH CONTROLLER ============

export const searchCommunity = async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
      throw new ApiError(400, 'Search query must be at least 2 characters');
    }

    const results = { posts: [], channels: [], messages: [] };

    if (type === 'all' || type === 'posts') {
      results.posts = await Post.find({
        $text: { $search: q },
        isDeleted: false
      })
        .limit(10)
        .lean();
    }

    if (type === 'all' || type === 'channels') {
      results.channels = await Channel.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      })
        .limit(10)
        .lean();
    }

    if (type === 'all' || type === 'messages') {
      results.messages = await Message.find({
        $text: { $search: q },
        isDeleted: false
      })
        .limit(10)
        .lean();
    }

    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

// Initialize default channels (run once)
export const initializeDefaultChannels = async () => {
  const defaultChannels = [
    { name: 'general', description: 'General discussions and introductions', icon: '💬', category: 'general', isDefault: true },
    { name: 'job-hunting', description: 'Share job opportunities and hunting tips', icon: '🔍', category: 'job-hunting', isDefault: true },
    { name: 'interview-prep', description: 'Interview preparation and experiences', icon: '🎯', category: 'interview-prep', isDefault: true },
    { name: 'resume-tips', description: 'Resume writing tips and reviews', icon: '📄', category: 'resume-tips', isDefault: true },
    { name: 'success-stories', description: 'Share your job search victories!', icon: '🎉', category: 'other', isDefault: true },
    { name: 'announcements', description: 'Important platform announcements', icon: '📢', category: 'announcements', isDefault: true }
  ];

  for (const ch of defaultChannels) {
    const exists = await Channel.findOne({ name: ch.name });
    if (!exists) {
      await Channel.create({
        ...ch,
        type: 'public',
        createdBy: 'system',
        createdByName: 'System'
      });
      console.log(`Created default channel: ${ch.name}`);
    }
  }
};
