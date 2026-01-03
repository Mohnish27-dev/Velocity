import Message from '../models/Message.model.js';
import Channel from '../models/Channel.model.js';
import Post from '../models/Post.model.js';
import Comment from '../models/Comment.model.js';
import { Conversation, DirectMessage } from '../models/DirectMessage.model.js';
import { presenceService } from './presenceService.js';

export const setupSocketHandlers = (io, socket) => {
  const user = socket.user;

  // ============ CHANNEL EVENTS ============

  // Join a channel
  socket.on('join_channel', async (channelId) => {
    try {
      const channel = await Channel.findById(channelId);
      if (!channel) {
        socket.emit('error', { message: 'Channel not found' });
        return;
      }

      socket.join(`channel:${channelId}`);
      console.log(`${user.name} joined channel: ${channel.name}`);

      // Notify others in the channel
      socket.to(`channel:${channelId}`).emit('user_joined_channel', {
        channelId,
        user: { uid: user.uid, name: user.name }
      });

      // Send recent messages
      const messages = await Message.find({ channel: channelId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      socket.emit('channel_messages', {
        channelId,
        messages: messages.reverse()
      });
    } catch (error) {
      console.error('Join channel error:', error);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  });

  // Leave a channel
  socket.on('leave_channel', (channelId) => {
    socket.leave(`channel:${channelId}`);
    socket.to(`channel:${channelId}`).emit('user_left_channel', {
      channelId,
      user: { uid: user.uid, name: user.name }
    });
  });

  // Send message to channel
  socket.on('send_message', async (data) => {
    try {
      const { channelId, content, replyTo, attachments } = data;

      if (!content || !content.trim()) {
        socket.emit('error', { message: 'Message content is required' });
        return;
      }

      // Create message
      const messageData = {
        content: content.trim(),
        channel: channelId,
        sender: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          avatar: user.picture
        },
        attachments: attachments || [],
        replyTo: replyTo || null
      };

      // Add reply preview if replying
      if (replyTo) {
        const originalMessage = await Message.findById(replyTo);
        if (originalMessage) {
          messageData.replyToPreview = {
            content: originalMessage.content.substring(0, 100),
            senderName: originalMessage.sender.name
          };
        }
      }

      const message = new Message(messageData);
      await message.save();

      // Update channel's last message
      await Channel.findByIdAndUpdate(channelId, {
        lastMessage: {
          content: content.substring(0, 100),
          senderName: user.name,
          timestamp: new Date()
        }
      });

      // Broadcast to channel
      io.to(`channel:${channelId}`).emit('new_message', {
        ...message.toObject(),
        channelId
      });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing_start', ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit('user_typing', {
      channelId,
      user: { uid: user.uid, name: user.name }
    });
  });

  socket.on('typing_stop', ({ channelId }) => {
    socket.to(`channel:${channelId}`).emit('user_stopped_typing', {
      channelId,
      user: { uid: user.uid, name: user.name }
    });
  });

  // Add reaction to message
  socket.on('add_reaction', async ({ messageId, emoji }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      // Find or create reaction
      let reaction = message.reactions.find(r => r.emoji === emoji);
      if (reaction) {
        // Check if user already reacted
        if (!reaction.users.some(u => u.uid === user.uid)) {
          reaction.users.push({ uid: user.uid, name: user.name });
        }
      } else {
        message.reactions.push({
          emoji,
          users: [{ uid: user.uid, name: user.name }]
        });
      }

      await message.save();

      io.to(`channel:${message.channel}`).emit('message_reaction_updated', {
        messageId,
        reactions: message.reactions
      });
    } catch (error) {
      console.error('Add reaction error:', error);
    }
  });

  // Remove reaction
  socket.on('remove_reaction', async ({ messageId, emoji }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const reaction = message.reactions.find(r => r.emoji === emoji);
      if (reaction) {
        reaction.users = reaction.users.filter(u => u.uid !== user.uid);
        if (reaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      }

      await message.save();

      io.to(`channel:${message.channel}`).emit('message_reaction_updated', {
        messageId,
        reactions: message.reactions
      });
    } catch (error) {
      console.error('Remove reaction error:', error);
    }
  });

  // Edit message
  socket.on('edit_message', async ({ messageId, content }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.sender.uid !== user.uid) {
        socket.emit('error', { message: 'Cannot edit this message' });
        return;
      }

      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      io.to(`channel:${message.channel}`).emit('message_edited', {
        messageId,
        content,
        editedAt: message.editedAt
      });
    } catch (error) {
      console.error('Edit message error:', error);
    }
  });

  // Delete message
  socket.on('delete_message', async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.sender.uid !== user.uid) {
        socket.emit('error', { message: 'Cannot delete this message' });
        return;
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

      io.to(`channel:${message.channel}`).emit('message_deleted', { messageId });
    } catch (error) {
      console.error('Delete message error:', error);
    }
  });

  // ============ DIRECT MESSAGE EVENTS ============

  // Start or get conversation
  socket.on('start_conversation', async ({ receiverId, receiverName, receiverEmail }) => {
    try {
      // Check if conversation exists
      let conversation = await Conversation.findOne({
        'participants.uid': { $all: [user.uid, receiverId] }
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [
            { uid: user.uid, name: user.name, email: user.email, avatar: user.picture },
            { uid: receiverId, name: receiverName, email: receiverEmail }
          ],
          unreadCount: new Map()
        });
        await conversation.save();
      }

      socket.emit('conversation_started', { conversation });
    } catch (error) {
      console.error('Start conversation error:', error);
      socket.emit('error', { message: 'Failed to start conversation' });
    }
  });

  // Send direct message
  socket.on('send_direct_message', async ({ conversationId, receiverId, content }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      const receiver = conversation.participants.find(p => p.uid === receiverId);

      const dm = new DirectMessage({
        conversation: conversationId,
        sender: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          avatar: user.picture
        },
        receiver: {
          uid: receiverId,
          name: receiver?.name
        },
        content
      });

      await dm.save();

      // Update conversation
      conversation.lastMessage = {
        content: content.substring(0, 100),
        senderId: user.uid,
        senderName: user.name,
        timestamp: new Date(),
        isRead: false
      };

      // Increment unread count for receiver
      const currentUnread = conversation.unreadCount.get(receiverId) || 0;
      conversation.unreadCount.set(receiverId, currentUnread + 1);
      await conversation.save();

      // Send to both users
      io.to(`user:${user.uid}`).to(`user:${receiverId}`).emit('new_direct_message', {
        message: dm.toObject(),
        conversation: conversation.toObject()
      });

    } catch (error) {
      console.error('Send DM error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('mark_messages_read', async ({ conversationId }) => {
    try {
      await DirectMessage.updateMany(
        { conversation: conversationId, 'receiver.uid': user.uid, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.unreadCount.set(user.uid, 0);
        await conversation.save();
      }

      socket.emit('messages_marked_read', { conversationId });
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });

  // DM typing indicator
  socket.on('dm_typing_start', ({ conversationId, receiverId }) => {
    io.to(`user:${receiverId}`).emit('dm_user_typing', {
      conversationId,
      user: { uid: user.uid, name: user.name }
    });
  });

  socket.on('dm_typing_stop', ({ conversationId, receiverId }) => {
    io.to(`user:${receiverId}`).emit('dm_user_stopped_typing', {
      conversationId,
      user: { uid: user.uid, name: user.name }
    });
  });

  // ============ POST/DISCUSSION EVENTS ============

  // New post notification
  socket.on('subscribe_posts', () => {
    socket.join('posts:feed');
  });

  socket.on('unsubscribe_posts', () => {
    socket.leave('posts:feed');
  });

  // Like post (real-time update)
  socket.on('like_post', async ({ postId }) => {
    try {
      const post = await Post.findById(postId);
      if (!post) return;

      const alreadyLiked = post.likes.some(l => l.uid === user.uid);
      if (alreadyLiked) {
        post.likes = post.likes.filter(l => l.uid !== user.uid);
      } else {
        post.likes.push({ uid: user.uid, name: user.name });
      }

      post.likeCount = post.likes.length;
      await post.save();

      io.to('posts:feed').emit('post_like_updated', {
        postId,
        likeCount: post.likeCount,
        likes: post.likes
      });
    } catch (error) {
      console.error('Like post error:', error);
    }
  });

  // New comment notification
  socket.on('new_comment', async ({ postId, content, parentCommentId }) => {
    try {
      const post = await Post.findById(postId);
      if (!post) return;

      const comment = new Comment({
        content,
        post: postId,
        author: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          avatar: user.picture
        },
        parentComment: parentCommentId || null
      });

      await comment.save();

      // Update comment count
      post.commentCount += 1;
      await post.save();

      // Update parent comment reply count if it's a reply
      if (parentCommentId) {
        await Comment.findByIdAndUpdate(parentCommentId, {
          $inc: { replyCount: 1 }
        });
      }

      io.to('posts:feed').emit('comment_added', {
        postId,
        comment: comment.toObject(),
        commentCount: post.commentCount
      });

      // Notify post author if different user
      if (post.author.uid !== user.uid) {
        io.to(`user:${post.author.uid}`).emit('notification', {
          type: 'comment',
          message: `${user.name} commented on your post`,
          postId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('New comment error:', error);
    }
  });

  // ============ PRESENCE EVENTS ============

  // Get online users
  socket.on('get_online_users', async () => {
    const onlineUsers = await presenceService.getOnlineUsers();
    socket.emit('online_users', { users: onlineUsers });
  });

  // Update user status
  socket.on('update_status', async ({ status }) => {
    if (status === 'away') {
      await presenceService.setAway(user.uid);
    } else if (status === 'online') {
      await presenceService.setOnline(user.uid, user);
    }

    io.emit('user_status_changed', {
      uid: user.uid,
      status,
      timestamp: new Date()
    });
  });
};

export default { setupSocketHandlers };
