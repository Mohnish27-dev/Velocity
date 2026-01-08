import { db } from '../config/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';
import { presenceService } from './presenceService.js';

// Collection references
const channelsRef = db.collection('channels');
const messagesRef = db.collection('messages');
const postsRef = db.collection('posts');
const commentsRef = db.collection('comments');
const conversationsRef = db.collection('conversations');
const directMessagesRef = db.collection('directMessages');

export const setupSocketHandlers = (io, socket) => {
  const user = socket.user;

  // ============ JOB ALERT EVENTS ============
  
  // Client can request job alert status
  socket.on('request_job_alerts_status', async () => {
    try {
      console.log(`📊 User ${user.email} requested job alerts status`);
      socket.emit('job_alerts_status', {
        message: 'Job alerts are active and monitoring',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Job alerts status error:', error);
    }
  });

  // ============ CHANNEL EVENTS ============

  // Join a channel
  socket.on('join_channel', async (channelId) => {
    try {
      const channelDoc = await channelsRef.doc(channelId).get();
      if (!channelDoc.exists) {
        socket.emit('error', { message: 'Channel not found' });
        return;
      }

      const channel = channelDoc.data();
      socket.join(`channel:${channelId}`);
      console.log(`${user.name} joined channel: ${channel.name}`);

      // Notify others in the channel
      socket.to(`channel:${channelId}`).emit('user_joined_channel', {
        channelId,
        user: { uid: user.uid, name: user.name }
      });

      // Fetch recent messages - use simple query without orderBy to avoid index requirement
      let messages = [];
      try {
        const messagesSnapshot = await messagesRef
          .where('channelId', '==', channelId)
          .get();

        messages = messagesSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
          }))
          .filter(msg => !msg.isDeleted);

        // Sort by createdAt descending, take 50, then reverse for chronological order
        messages.sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
        messages = messages.slice(0, 50).reverse();
      } catch (msgError) {
        console.error('Error fetching messages:', msgError.message);
        // Continue with empty messages array
      }

      socket.emit('channel_messages', {
        channelId,
        messages
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
      const { channelId, content, replyTo, attachments, tempId } = data;

      if (!content || !content.trim()) {
        socket.emit('error', { message: 'Message content is required' });
        return;
      }

      // Create message data
      const messageData = {
        content: content.trim(),
        channelId,
        sender: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          avatar: user.picture || null
        },
        messageType: 'text',
        attachments: attachments || [],
        reactions: [],
        mentions: [],
        replyTo: replyTo || null,
        replyToPreview: null,
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        readBy: [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      // Add reply preview if replying
      if (replyTo) {
        const originalMessageDoc = await messagesRef.doc(replyTo).get();
        if (originalMessageDoc.exists) {
          const originalMessage = originalMessageDoc.data();
          messageData.replyToPreview = {
            content: originalMessage.content.substring(0, 100),
            senderName: originalMessage.sender.name
          };
        }
      }

      const docRef = await messagesRef.add(messageData);
      const savedMessage = { 
        id: docRef.id, 
        ...messageData, 
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update channel's last message (don't await - do in background)
      channelsRef.doc(channelId).update({
        lastMessage: {
          content: content.substring(0, 100),
          senderName: user.name,
          timestamp: new Date().toISOString()
        },
        updatedAt: FieldValue.serverTimestamp()
      }).catch(err => console.error('Failed to update channel lastMessage:', err));

      // Send confirmation to sender with tempId to replace optimistic message
      socket.emit('message_confirmed', {
        ...savedMessage,
        channelId,
        tempId
      });

      // Broadcast to OTHER users in channel (not the sender)
      socket.to(`channel:${channelId}`).emit('new_message', {
        ...savedMessage,
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
      const messageDoc = await messagesRef.doc(messageId).get();
      if (!messageDoc.exists) return;

      const message = messageDoc.data();
      let reactions = message.reactions || [];

      // Find existing reaction with same emoji
      const reactionIndex = reactions.findIndex(r => r.emoji === emoji);
      
      if (reactionIndex >= 0) {
        // Check if user already reacted
        const userReacted = reactions[reactionIndex].users.some(u => u.uid === user.uid);
        if (!userReacted) {
          reactions[reactionIndex].users.push({ uid: user.uid, name: user.name });
        }
      } else {
        reactions.push({
          emoji,
          users: [{ uid: user.uid, name: user.name }]
        });
      }

      await messagesRef.doc(messageId).update({ reactions });

      io.to(`channel:${message.channelId}`).emit('message_reaction_updated', {
        messageId,
        reactions
      });
    } catch (error) {
      console.error('Add reaction error:', error);
    }
  });

  // Remove reaction
  socket.on('remove_reaction', async ({ messageId, emoji }) => {
    try {
      const messageDoc = await messagesRef.doc(messageId).get();
      if (!messageDoc.exists) return;

      const message = messageDoc.data();
      let reactions = message.reactions || [];

      const reactionIndex = reactions.findIndex(r => r.emoji === emoji);
      if (reactionIndex >= 0) {
        reactions[reactionIndex].users = reactions[reactionIndex].users.filter(u => u.uid !== user.uid);
        if (reactions[reactionIndex].users.length === 0) {
          reactions = reactions.filter(r => r.emoji !== emoji);
        }
      }

      await messagesRef.doc(messageId).update({ reactions });

      io.to(`channel:${message.channelId}`).emit('message_reaction_updated', {
        messageId,
        reactions
      });
    } catch (error) {
      console.error('Remove reaction error:', error);
    }
  });

  // Edit message
  socket.on('edit_message', async ({ messageId, content }) => {
    try {
      const messageDoc = await messagesRef.doc(messageId).get();
      if (!messageDoc.exists) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      const message = messageDoc.data();
      if (message.sender.uid !== user.uid) {
        socket.emit('error', { message: 'Cannot edit this message' });
        return;
      }

      const editedAt = new Date();
      await messagesRef.doc(messageId).update({
        content,
        isEdited: true,
        editedAt: FieldValue.serverTimestamp()
      });

      io.to(`channel:${message.channelId}`).emit('message_edited', {
        messageId,
        content,
        editedAt
      });
    } catch (error) {
      console.error('Edit message error:', error);
    }
  });

  // Delete message
  socket.on('delete_message', async ({ messageId }) => {
    try {
      const messageDoc = await messagesRef.doc(messageId).get();
      if (!messageDoc.exists) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      const message = messageDoc.data();
      if (message.sender.uid !== user.uid) {
        socket.emit('error', { message: 'Cannot delete this message' });
        return;
      }

      await messagesRef.doc(messageId).update({
        isDeleted: true,
        deletedAt: FieldValue.serverTimestamp()
      });

      io.to(`channel:${message.channelId}`).emit('message_deleted', { messageId });
    } catch (error) {
      console.error('Delete message error:', error);
    }
  });

  // ============ DIRECT MESSAGE EVENTS ============

  // Start or get conversation
  socket.on('start_conversation', async ({ receiverId, receiverName, receiverEmail }) => {
    try {
      // Check if conversation exists - search for both participants
      const existingSnapshot = await conversationsRef
        .where('participantIds', 'array-contains', user.uid)
        .get();

      let conversation = null;
      existingSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.participantIds.includes(receiverId)) {
          conversation = { id: doc.id, ...data };
        }
      });

      if (!conversation) {
        const conversationData = {
          participants: [
            { uid: user.uid, name: user.name, email: user.email, avatar: user.picture || null },
            { uid: receiverId, name: receiverName, email: receiverEmail, avatar: null }
          ],
          participantIds: [user.uid, receiverId],
          lastMessage: null,
          unreadCount: {
            [user.uid]: 0,
            [receiverId]: 0
          },
          isActive: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        };

        const docRef = await conversationsRef.add(conversationData);
        conversation = { id: docRef.id, ...conversationData, createdAt: new Date(), updatedAt: new Date() };
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
      const convDoc = await conversationsRef.doc(conversationId).get();
      if (!convDoc.exists) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      const conversation = convDoc.data();
      const receiver = conversation.participants.find(p => p.uid === receiverId);

      const dmData = {
        conversationId,
        sender: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          avatar: user.picture || null
        },
        receiver: {
          uid: receiverId,
          name: receiver?.name || 'Unknown'
        },
        content,
        messageType: 'text',
        attachments: [],
        isRead: false,
        isEdited: false,
        isDeleted: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const docRef = await directMessagesRef.add(dmData);
      const savedDm = { id: docRef.id, ...dmData, createdAt: new Date(), updatedAt: new Date() };

      // Update conversation
      const currentUnread = conversation.unreadCount?.[receiverId] || 0;
      await conversationsRef.doc(conversationId).update({
        lastMessage: {
          content: content.substring(0, 100),
          senderId: user.uid,
          senderName: user.name,
          timestamp: new Date().toISOString(),
          isRead: false
        },
        [`unreadCount.${receiverId}`]: currentUnread + 1,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Get updated conversation
      const updatedConvDoc = await conversationsRef.doc(conversationId).get();
      const updatedConversation = { id: updatedConvDoc.id, ...updatedConvDoc.data() };

      // Send to both users
      io.to(`user:${user.uid}`).to(`user:${receiverId}`).emit('new_direct_message', {
        message: savedDm,
        conversation: updatedConversation
      });

    } catch (error) {
      console.error('Send DM error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('mark_messages_read', async ({ conversationId }) => {
    try {
      // Get unread messages for this user
      const unreadSnapshot = await directMessagesRef
        .where('conversationId', '==', conversationId)
        .where('receiver.uid', '==', user.uid)
        .where('isRead', '==', false)
        .get();

      // Update each message
      const batch = db.batch();
      unreadSnapshot.forEach(doc => {
        batch.update(doc.ref, { isRead: true, readAt: FieldValue.serverTimestamp() });
      });
      await batch.commit();

      // Reset unread count
      await conversationsRef.doc(conversationId).update({
        [`unreadCount.${user.uid}`]: 0
      });

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
      const postDoc = await postsRef.doc(postId).get();
      if (!postDoc.exists) return;

      const post = postDoc.data();
      const likes = post.likes || [];
      const alreadyLiked = likes.some(l => l.uid === user.uid);

      const likeData = { uid: user.uid, name: user.name, likedAt: new Date().toISOString() };

      if (alreadyLiked) {
        const likeToRemove = likes.find(l => l.uid === user.uid);
        await postsRef.doc(postId).update({
          likes: FieldValue.arrayRemove(likeToRemove),
          likeCount: FieldValue.increment(-1)
        });
      } else {
        await postsRef.doc(postId).update({
          likes: FieldValue.arrayUnion(likeData),
          likeCount: FieldValue.increment(1)
        });
      }

      // Get updated post
      const updatedPostDoc = await postsRef.doc(postId).get();
      const updatedPost = updatedPostDoc.data();

      io.to('posts:feed').emit('post_like_updated', {
        postId,
        likeCount: updatedPost.likeCount,
        likes: updatedPost.likes
      });
    } catch (error) {
      console.error('Like post error:', error);
    }
  });

  // New comment notification
  socket.on('new_comment', async ({ postId, content, parentCommentId }) => {
    try {
      const postDoc = await postsRef.doc(postId).get();
      if (!postDoc.exists) return;

      const post = postDoc.data();

      const commentData = {
        content,
        postId,
        author: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          avatar: user.picture || null
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
      const savedComment = { id: docRef.id, ...commentData, createdAt: new Date() };

      // Update comment count
      await postsRef.doc(postId).update({
        commentCount: FieldValue.increment(1)
      });

      // Update parent comment reply count if it's a reply
      if (parentCommentId) {
        await commentsRef.doc(parentCommentId).update({
          replyCount: FieldValue.increment(1)
        });
      }

      const newCommentCount = (post.commentCount || 0) + 1;

      io.to('posts:feed').emit('comment_added', {
        postId,
        comment: savedComment,
        commentCount: newCommentCount
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
