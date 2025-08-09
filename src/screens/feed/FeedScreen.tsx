/**
 * Aether - Feed Screen
 * Bare minimum feed screen showing only data structure
 */

import React from 'react';
import { View, Text } from 'react-native';

// Services only - no UI imports
import { PostsAPI, type Post } from '../../services/postsApi';
import { SocialProxyAPI } from '../../services/apiModules';

interface FeedScreenProps {
  navigation: any;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Feed Screen - Services Available
      </Text>
      <Text style={{ fontSize: 14, color: '#666' }}>
        UI/Styling removed. Available services documented below.
      </Text>
    </View>
  );
};


export default FeedScreen;