import { db } from '../config/firebase.js';
import { presenceService } from '../services/presenceService.js';
import { getIO } from '../config/socket.js';
import { ApiError } from '../middleware/errorHandler.js';
import { FieldValue } from 'firebase-admin/firestore';

// Collection references
const channelsRef = db.collection('channels');
const messagesRef = db.collection('messages');
const postsRef = db.collection('posts');
const commentsRef = db.collection('comments');
const conversationsRef = db.collection('conversations');
const directMessagesRef = db.collection('directMessages');

// ============ CHANNEL CONTROLLERS ============

// Get all channels
export const getChannels = async (req, res, next) => {
  try {
    const { type = 'all' } = req.query;
    
    // Simple query - fetch all and sort in memory to avoid composite index requirement
    const snapshot = await channelsRef.get();
    
    let channels = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by type if specified
    if (type === 'public') {
      channels = channels.filter(ch => ch.type === 'public');
    } else if (type === 'private') {
      channels = channels.filter(ch => ch.type === 'private');
      // Also filter for user membership
      channels = channels.filter(ch => 
        ch.members && ch.members.some(m => m.uid === req.user.uid)
      );
    }

    // Sort: default channels first, then by createdAt descending
    channels.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?._seconds * 1000 || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?._seconds * 1000 || 0;
      return bTime - aTime;
    });

    res.json({ success: true, channels });
  } catch (error) {
    next(error);
  }
};

// Get single channel
export const getChannel = async (req, res, next) => {
  try {
    const doc = await channelsRef.doc(req.params.channelId).get();
    
    if (!doc.exists) {
      throw new ApiError(404, 'Channel not found');
    }

    res.json({ success: true, channel: { id: doc.id, ...doc.data() } });
  } catch (error) {
    next(error);
  }
};

// Create channel
export const createChannel = async (req, res, next) => {
  try {
    const { name, description, type = 'public', category = 'general', icon } = req.body;

    const channelName = name.toLowerCase().replace(/\s+/g, '-');

    // Check if channel name exists
    const existingSnapshot = await channelsRef.where('name', '==', channelName).get();
    if (!existingSnapshot.empty) {
      throw new ApiError(400, 'Channel with this name already exists');
    }

    const channelData = {
      name: channelName,
      description: description || '',
      type,
      category,
      icon: icon || '💬',
      createdBy: req.user.uid,
      createdByName: req.user.name,
      members: [{
        uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        role: 'admin',
        joinedAt: new Date().toISOString()
      }],
      memberCount: 1,
      isDefault: false,
      lastMessage: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const docRef = await channelsRef.add(channelData);
    const newChannel = { id: docRef.id, ...channelData, createdAt: new Date(), updatedAt: new Date() };

    // Notify all users about new channel
    try {
      const io = getIO();
      io.emit('new_channel', { channel: newChannel });
    } catch (e) {
      // Socket might not be initialized yet
    }

    res.status(201).json({ success: true, channel: newChannel });
  } catch (error) {
    next(error);
  }
};

// Join channel
export const joinChannel = async (req, res, next) => {
  try {
    const channelDoc = await channelsRef.doc(req.params.channelId).get();
    
    if (!channelDoc.exists) {
      throw new ApiError(404, 'Channel not found');
    }

    const channel = { id: channelDoc.id, ...channelDoc.data() };

    // Check if already a member
    if (channel.members && channel.members.some(m => m.uid === req.user.uid)) {
      return res.json({ success: true, message: 'Already a member', channel });
    }

    const newMember = {
      uid: req.user.uid,
      name: req.user.name,
      email: req.user.email,
      role: 'member',
      joinedAt: new Date().toISOString()
    };

    await channelsRef.doc(req.params.channelId).update({
      members: FieldValue.arrayUnion(newMember),
      memberCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    });

    channel.members.push(newMember);
    channel.memberCount = (channel.memberCount || 0) + 1;

    res.json({ success: true, channel });
  } catch (error) {
    next(error);
  }
};

// Leave channel
export const leaveChannel = async (req, res, next) => {
  try {
    const channelDoc = await channelsRef.doc(req.params.channelId).get();
    
    if (!channelDoc.exists) {
      throw new ApiError(404, 'Channel not found');
    }

    const channel = channelDoc.data();

    if (channel.isDefault) {
      throw new ApiError(400, 'Cannot leave default channel');
    }

    const memberToRemove = channel.members.find(m => m.uid === req.user.uid);
    if (memberToRemove) {
      await channelsRef.doc(req.params.channelId).update({
        members: FieldValue.arrayRemove(memberToRemove),
        memberCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    res.json({ success: true, message: 'Left channel successfully' });
  } catch (error) {
    next(error);
  }
};

// Get channel messages
export const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;
    const limitNum = parseInt(limit);

    // Simple query - filter and sort in memory to avoid composite index
    const snapshot = await messagesRef.where('channelId', '==', channelId).get();
    
    let messages = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }))
      .filter(msg => !msg.isDeleted);

    // Filter by before timestamp if provided
    if (before) {
      const beforeDate = new Date(before);
      messages = messages.filter(msg => {
        const msgTime = msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt);
        return msgTime < beforeDate;
      });
    }

    const total = messages.length;

    // Sort by createdAt descending, take limit, then reverse for chronological order
    messages.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
    messages = messages.slice(0, limitNum).reverse();

    res.json({
      success: true,
      messages,
      pagination: {
        limit: limitNum,
        total,
        hasMore: total > limitNum
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
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Simple query - filter and sort in memory to avoid composite index
    const snapshot = await postsRef.get();
    
    let posts = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const likes = data.likes || [];
        return {
          id: doc.id,
          ...data,
          // Always use the actual likes array length as the source of truth
          likeCount: likes.length,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        };
      })
      .filter(post => !post.isDeleted);

    // Filter by category if specified
    if (category && category !== 'all') {
      posts = posts.filter(post => post.category === category);
    }

    const total = posts.length;

    // Sort based on sortBy parameter
    if (sortBy === 'popular') {
      posts.sort((a, b) => {
        const likeDiff = (b.likeCount || 0) - (a.likeCount || 0);
        if (likeDiff !== 0) return likeDiff;
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    } else if (sortBy === 'trending') {
      posts.sort((a, b) => {
        const viewsDiff = (b.views || 0) - (a.views || 0);
        if (viewsDiff !== 0) return viewsDiff;
        return (b.likeCount || 0) - (a.likeCount || 0);
      });
    } else {
      // Default: latest
      posts.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
    }

    // Paginate
    const startIndex = (pageNum - 1) * limitNum;
    posts = posts.slice(startIndex, startIndex + limitNum);

    res.json({
      success: true,
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: total > pageNum * limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single post
export const getPost = async (req, res, next) => {
  try {
    const doc = await postsRef.doc(req.params.postId).get();
    
    if (!doc.exists || doc.data().isDeleted) {
      throw new ApiError(404, 'Post not found');
    }

    const data = doc.data();
    const likes = data.likes || [];
    const post = { 
      id: doc.id, 
      ...data,
      // Always use the actual likes array length as the source of truth
      likeCount: likes.length
    };

    // Increment view count
    const viewedBy = post.viewedBy || [];
    if (!viewedBy.includes(req.user.uid)) {
      await postsRef.doc(req.params.postId).update({
        views: FieldValue.increment(1),
        viewedBy: FieldValue.arrayUnion(req.user.uid)
      });
      post.views = (post.views || 0) + 1;
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

    const postData = {
      title,
      content,
      tags: tags.map(t => t.toLowerCase().trim()),
      category,
      attachments,
      author: {
        uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.picture || null
      },
      likes: [],
      likeCount: 0,
      commentCount: 0,
      views: 0,
      viewedBy: [],
      isPinned: false,
      isAnnouncement: false,
      isEdited: false,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const docRef = await postsRef.add(postData);
    const newPost = { id: docRef.id, ...postData, createdAt: new Date(), updatedAt: new Date() };

    // Notify subscribers
    try {
      const io = getIO();
      io.to('posts:feed').emit('new_post', { post: newPost });
    } catch (e) {
      // Socket might not be initialized
    }

    res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    next(error);
  }
};

// Update post
export const updatePost = async (req, res, next) => {
  try {
    const doc = await postsRef.doc(req.params.postId).get();
    
    if (!doc.exists) {
      throw new ApiError(404, 'Post not found');
    }

    const post = doc.data();

    if (post.author.uid !== req.user.uid) {
      throw new ApiError(403, 'Not authorized to edit this post');
    }

    const { title, content, tags, category } = req.body;

    const updateData = {
      isEdited: true,
      editedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (tags) updateData.tags = tags.map(t => t.toLowerCase().trim());
    if (category) updateData.category = category;

    await postsRef.doc(req.params.postId).update(updateData);

    const updatedPost = { id: doc.id, ...post, ...updateData };
    res.json({ success: true, post: updatedPost });
  } catch (error) {
    next(error);
  }
};

// Delete post
export const deletePost = async (req, res, next) => {
  try {
    const doc = await postsRef.doc(req.params.postId).get();
    
    if (!doc.exists) {
      throw new ApiError(404, 'Post not found');
    }

    const post = doc.data();

    if (post.author.uid !== req.user.uid) {
      throw new ApiError(403, 'Not authorized to delete this post');
    }

    await postsRef.doc(req.params.postId).update({
      isDeleted: true,
      deletedAt: FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Like/Unlike post
export const toggleLikePost = async (req, res, next) => {
  try {
    const doc = await postsRef.doc(req.params.postId).get();
    
    if (!doc.exists) {
      throw new ApiError(404, 'Post not found');
    }

    const post = doc.data();
    const likes = post.likes || [];
    const currentLikeCount = post.likeCount || 0;
    const alreadyLiked = likes.some(l => l.uid === req.user.uid);

    const likeData = { uid: req.user.uid, name: req.user.name, likedAt: new Date().toISOString() };

    let newLikeCount;
    let newLikes;

    if (alreadyLiked) {
      // Find and remove the like
      const likeToRemove = likes.find(l => l.uid === req.user.uid);
      newLikeCount = Math.max(0, currentLikeCount - 1); // Ensure it doesn't go negative
      newLikes = likes.filter(l => l.uid !== req.user.uid);
      
      await postsRef.doc(req.params.postId).update({
        likes: newLikes,
        likeCount: newLikeCount
      });
    } else {
      newLikeCount = currentLikeCount + 1;
      newLikes = [...likes, likeData];
      
      await postsRef.doc(req.params.postId).update({
        likes: newLikes,
        likeCount: newLikeCount
      });
    }

    // Notify via socket
    try {
      const io = getIO();
      io.to('posts:feed').emit('post_like_updated', {
        postId: req.params.postId,
        likeCount: newLikeCount,
        likes: newLikes
      });
    } catch (e) {
      // Socket might not be initialized
    }

    res.json({
      success: true,
      liked: !alreadyLiked,
      likeCount: newLikeCount
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
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Simple query - filter and sort in memory to avoid composite index
    const snapshot = await commentsRef.where('postId', '==', postId).get();
    
    const allComments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Filter top-level comments (not deleted, no parent)
    let topLevelComments = allComments
      .filter(c => !c.isDeleted && !c.parentCommentId)
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
        return aTime - bTime;
      });

    const total = topLevelComments.length;

    // Paginate
    const startIndex = (pageNum - 1) * limitNum;
    topLevelComments = topLevelComments.slice(startIndex, startIndex + limitNum);

    // Get replies for each comment from already fetched data
    const commentsWithReplies = topLevelComments.map(comment => {
      const replies = allComments
        .filter(c => c.parentCommentId === comment.id && !c.isDeleted)
        .sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
          return aTime - bTime;
        })
        .slice(0, 5);
      return { ...comment, replies };
    });

    res.json({
      success: true,
      comments: commentsWithReplies,
      pagination: {
        page: pageNum,
        limit: limitNum,
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

    const postDoc = await postsRef.doc(postId).get();
    if (!postDoc.exists) {
      throw new ApiError(404, 'Post not found');
    }

    const commentData = {
      content,
      postId,
      author: {
        uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.picture || null
      },
      parentCommentId: parentCommentId || null,
      likes: [],
      likeCount: 0,
      replyCount: 0,
      isEdited: false,
      isDeleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const docRef = await commentsRef.add(commentData);

    // Update post comment count
    await postsRef.doc(postId).update({
      commentCount: FieldValue.increment(1)
    });

    // Update parent comment reply count if it's a reply
    if (parentCommentId) {
      await commentsRef.doc(parentCommentId).update({
        replyCount: FieldValue.increment(1)
      });
    }

    const newComment = { id: docRef.id, ...commentData, createdAt: new Date() };
    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    next(error);
  }
};

// Like/Unlike comment
export const toggleLikeComment = async (req, res, next) => {
  try {
    const doc = await commentsRef.doc(req.params.commentId).get();
    
    if (!doc.exists) {
      throw new ApiError(404, 'Comment not found');
    }

    const comment = doc.data();
    const likes = comment.likes || [];
    const currentLikeCount = comment.likeCount || 0;
    const alreadyLiked = likes.some(l => l.uid === req.user.uid);

    const likeData = { uid: req.user.uid, name: req.user.name };

    let newLikeCount;
    let newLikes;

    if (alreadyLiked) {
      newLikeCount = Math.max(0, currentLikeCount - 1); // Ensure it doesn't go negative
      newLikes = likes.filter(l => l.uid !== req.user.uid);
      
      await commentsRef.doc(req.params.commentId).update({
        likes: newLikes,
        likeCount: newLikeCount
      });
    } else {
      newLikeCount = currentLikeCount + 1;
      newLikes = [...likes, likeData];
      
      await commentsRef.doc(req.params.commentId).update({
        likes: newLikes,
        likeCount: newLikeCount
      });
    }

    res.json({
      success: true,
      liked: !alreadyLiked,
      likeCount: newLikeCount
    });
  } catch (error) {
    next(error);
  }
};

// ============ DIRECT MESSAGE CONTROLLERS ============

// Get user's conversations
export const getConversations = async (req, res, next) => {
  try {
    // Simple query - filter and sort in memory to avoid composite index
    const snapshot = await conversationsRef
      .where('participantIds', 'array-contains', req.user.uid)
      .get();

    let conversations = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(conv => conv.isActive !== false);

    // Sort by updatedAt descending
    conversations.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || a.updatedAt?._seconds * 1000 || 0;
      const bTime = b.updatedAt?.toMillis?.() || b.updatedAt?._seconds * 1000 || 0;
      return bTime - aTime;
    });

    conversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipant = conv.participants?.find(p => p.uid !== req.user.uid);
        const isOnline = await presenceService.isOnline(otherParticipant?.uid);
        const unreadCount = conv.unreadCount?.[req.user.uid] || 0;
        
        return {
          ...conv,
          otherParticipant,
          isOnline,
          unreadCount,
          updatedAt: conv.updatedAt?.toDate?.() || conv.updatedAt
        };
      })
    );

    res.json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

// Get messages in a conversation
export const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;
    const limitNum = parseInt(limit);

    // Verify user is part of conversation
    const convDoc = await conversationsRef.doc(conversationId).get();
    if (!convDoc.exists) {
      throw new ApiError(404, 'Conversation not found');
    }

    const conversation = convDoc.data();
    if (!conversation.participantIds.includes(req.user.uid)) {
      throw new ApiError(403, 'Not authorized to view this conversation');
    }

    // Simple query - filter and sort in memory to avoid composite index
    const snapshot = await directMessagesRef
      .where('conversationId', '==', conversationId)
      .get();

    let messages = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }))
      .filter(msg => !msg.isDeleted);

    // Sort by createdAt descending, take limit, then reverse
    messages.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
    messages = messages.slice(0, limitNum).reverse();

    res.json({
      success: true,
      messages,
      conversation: { id: convDoc.id, ...conversation }
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
    const searchQuery = q.toLowerCase();

    if (type === 'all' || type === 'posts') {
      // Search posts - simple query to avoid composite index
      const postsSnapshot = await postsRef.get();
      
      let postResults = postsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(post => !post.isDeleted);
      
      // Sort by createdAt descending
      postResults.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?._seconds * 1000 || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?._seconds * 1000 || 0;
        return bTime - aTime;
      });
      
      results.posts = postResults
        .filter(post => 
          post.title?.toLowerCase().includes(searchQuery) ||
          post.content?.toLowerCase().includes(searchQuery) ||
          post.tags?.some(tag => tag.includes(searchQuery))
        )
        .slice(0, 10);
    }

    if (type === 'all' || type === 'channels') {
      const channelsSnapshot = await channelsRef.get();
      
      results.channels = channelsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(ch => 
          ch.name?.toLowerCase().includes(searchQuery) ||
          ch.description?.toLowerCase().includes(searchQuery)
        )
        .slice(0, 10);
    }

    if (type === 'all' || type === 'messages') {
      // Search messages - simple query to avoid composite index
      const messagesSnapshot = await messagesRef.get();
      
      let messageResults = messagesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(msg => !msg.isDeleted);
      
      // Sort by createdAt descending
      messageResults.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?._seconds * 1000 || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?._seconds * 1000 || 0;
        return bTime - aTime;
      });
      
      results.messages = messageResults
        .filter(msg => msg.content?.toLowerCase().includes(searchQuery))
        .slice(0, 10);
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
    // Check if channel exists
    const existingSnapshot = await channelsRef.where('name', '==', ch.name).get();
    
    if (existingSnapshot.empty) {
      await channelsRef.add({
        ...ch,
        type: 'public',
        createdBy: 'system',
        createdByName: 'System',
        members: [],
        memberCount: 0,
        lastMessage: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log(`Created default channel: ${ch.name}`);
    }
  }
};

// Fix posts with incorrect like counts (one-time utility)
export const fixPostLikeCounts = async (req, res, next) => {
  try {
    const snapshot = await postsRef.get();
    let fixed = 0;

    for (const doc of snapshot.docs) {
      const post = doc.data();
      const likes = post.likes || [];
      const actualLikeCount = likes.length;
      const storedLikeCount = post.likeCount || 0;

      // Fix if mismatch or negative
      if (storedLikeCount !== actualLikeCount || storedLikeCount < 0) {
        await postsRef.doc(doc.id).update({
          likeCount: actualLikeCount
        });
        fixed++;
        console.log(`Fixed post ${doc.id}: ${storedLikeCount} -> ${actualLikeCount}`);
      }
    }

    res.json({ success: true, message: `Fixed ${fixed} posts` });
  } catch (error) {
    next(error);
  }
};

// Export collection references for socket service
export { channelsRef, messagesRef, postsRef, commentsRef, conversationsRef, directMessagesRef };
