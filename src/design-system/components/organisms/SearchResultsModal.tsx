/**
 * Custom Results Modal - Streamlined modal for displaying search results
 * Uses design tokens and reuses WebSearchResult components
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../../contexts/ThemeContext';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { spacing } from '../../tokens/spacing';
import { typography } from '../../tokens/typography';
import WebSearchResult from '../molecules/WebSearchResult';
import Icon from '../atoms/Icon';

const { width, height } = Dimensions.get('window');

interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  position?: number;
}

interface CustomResultsModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  results: SearchResult[];
}

const CustomResultsModal: React.FC<CustomResultsModalProps> = ({
  visible,
  onClose,
  title,
  results,
}) => {
  const { colors, theme } = useTheme();

  const renderResult = ({ item, index }: { item: SearchResult; index: number }) => (
    <WebSearchResult
      result={{
        title: item.title,
        snippet: item.snippet || '',
        url: item.url,
        source: item.source,
        position: item.position || index + 1,
      }}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon
        name="search"
        size={48}
        color={colors.textMuted}
      />
      <Text style={[
        styles.emptyText,
        { color: colors.textMuted }
      ]}>
        No results found
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={theme === 'dark' ? 40 : 60}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalContainer,
              getGlassmorphicStyle('overlay', theme),
              {
                backgroundColor: colors.surface,
                borderColor: colors.borders.default,
              }
            ]}
          >
            {/* Header */}
            <View style={[
              styles.header,
              { borderBottomColor: colors.borders.subtle }
            ]}>
              <View style={styles.headerContent}>
                <Icon
                  name="search"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[
                  styles.headerTitle,
                  { color: colors.text }
                ]}>
                  {title}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={onClose} 
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.surfaces.elevated }
                ]}
              >
                <Icon
                  name="x"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Results Count */}
            {results.length > 0 && (
              <View style={styles.countContainer}>
                <Text style={[
                  styles.countText,
                  { color: colors.textSecondary }
                ]}>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* Results List */}
            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={(item, index) => `${item.url}-${index}`}
              style={styles.resultsList}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  modalContainer: {
    width: Math.min(width - 32, 600),
    maxHeight: height * 0.85,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fonts.headingMedium,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: spacing[2],
  },
  closeButton: {
    padding: spacing[2],
    borderRadius: 8,
  },
  countContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  countText: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    fontWeight: '500',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: 16,
    marginTop: spacing[4],
    textAlign: 'center',
  },
});

export default CustomResultsModal;