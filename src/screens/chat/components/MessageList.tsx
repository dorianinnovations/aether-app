/**
 * Message List Component
 * Handles the scrollable list of messages with proper rendering and animations
 */

import React, { RefObject } from 'react';
import { FlatList, View, StyleSheet, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import EnhancedBubble from '../../../design-system/components/molecules/EnhancedBubble';
import type { Message } from '../../../types/chat';

interface MessageListProps {
  messages: Message[];
  theme: 'light' | 'dark';
  flatListRef: RefObject<FlatList | null>;
  onScrollToIndexFailed?: (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  extraPaddingBottom?: number;
  ListFooterComponent?: () => React.ReactElement | null;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  theme,
  flatListRef,
  onScrollToIndexFailed,
  onScroll,
  onMomentumScrollEnd,
  extraPaddingBottom = 0,
  ListFooterComponent,
}) => {
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    return (
      <View style={styles.messageItem}>
        <EnhancedBubble
          message={item}
          index={index}
          theme={theme}
          messageIndex={index}
        />
      </View>
    );
  };

  const keyExtractor = (item: Message) => `message-${item.id || Math.random()}`;

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={keyExtractor}
      style={styles.messagesList}
      contentContainerStyle={[
        styles.messagesContainer,
        { paddingBottom: Math.max(100 + extraPaddingBottom, 120) }
      ]}
      showsVerticalScrollIndicator={false}
      onScrollToIndexFailed={onScrollToIndexFailed}
      onScroll={onScroll}
      onMomentumScrollEnd={onMomentumScrollEnd}
      scrollEventThrottle={16}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 100,
      }}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={15}
      getItemLayout={(data, index) => ({
        length: 80, // Approximate item height
        offset: 80 * index,
        index,
      })}
      ListFooterComponent={ListFooterComponent}
    />
  );
};

const styles = StyleSheet.create({
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
    paddingTop: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageItem: {
    marginBottom: 8,
  },
});