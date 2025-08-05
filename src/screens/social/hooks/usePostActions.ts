/**
 * Post Actions Hook
 * Handles like, share, comment actions with optimistic updates
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import type { Post, CreateCommentData } from '../types';

export interface UsePostActionsProps {
  onPostUpdate: (postId: string, updates: Partial<Post>) => void;
}

export interface UsePostActionsReturn {
  likePost: (post: Post) => Promise<void>;
  sharePost: (post: Post) => Promise<void>;
  commentOnPost: (post: Post, commentData: CreateCommentData) => Promise<void>;
  reportPost: (post: Post) => Promise<void>;
}

export const usePostActions = ({
  onPostUpdate,
}: UsePostActionsProps): UsePostActionsReturn => {
  const likePost = useCallback(async (post: Post) => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Optimistic update
      const isCurrentlyLiked = post.isLiked;
      const newLikeCount = isCurrentlyLiked ? post.likes - 1 : post.likes + 1;
      
      onPostUpdate(post.id, {
        isLiked: !isCurrentlyLiked,
        likes: newLikeCount,
      });

      // TODO: Make actual API call
      // await postsApi.likePost(post.id, !isCurrentlyLiked);
      
      console.log(`${isCurrentlyLiked ? 'Unliked' : 'Liked'} post:`, post.id);
    } catch (error) {
      // Revert optimistic update on error
      onPostUpdate(post.id, {
        isLiked: post.isLiked,
        likes: post.likes,
      });
      
      console.error('Error liking post:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [onPostUpdate]);

  const sharePost = useCallback(async (post: Post) => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Optimistic update
      onPostUpdate(post.id, {
        shares: post.shares + 1,
      });

      // TODO: Implement actual sharing functionality
      // This could integrate with React Native Share API
      console.log('Shared post:', post.id);
      
      // TODO: Make API call to track share
      // await postsApi.sharePost(post.id);
    } catch (error) {
      // Revert optimistic update on error
      onPostUpdate(post.id, {
        shares: post.shares,
      });
      
      console.error('Error sharing post:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [onPostUpdate]);

  const commentOnPost = useCallback(async (post: Post, commentData: CreateCommentData) => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Optimistic update
      onPostUpdate(post.id, {
        comments: post.comments + 1,
      });

      // TODO: Make actual API call
      // const newComment = await postsApi.createComment(commentData);
      
      console.log('Commented on post:', post.id, commentData);
    } catch (error) {
      // Revert optimistic update on error
      onPostUpdate(post.id, {
        comments: post.comments,
      });
      
      console.error('Error commenting on post:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [onPostUpdate]);

  const reportPost = useCallback(async (post: Post) => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // TODO: Implement reporting functionality
      console.log('Reported post:', post.id);
      
      // TODO: Make API call to report post
      // await postsApi.reportPost(post.id);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error reporting post:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  return {
    likePost,
    sharePost,
    commentOnPost,
    reportPost,
  };
};
