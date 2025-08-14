/**
 * Grails Section - User's All-Time Favorite Songs & Albums
 * Allows users to pin their top 3 songs and top 3 albums with search functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';
import { FadedBorder } from '../../../components/FadedBorder';
import { SpotifyAPI } from '../../../services/api';
import { logger } from '../../../utils/logger';
import { LottieLoader } from '../atoms';

export interface GrailTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  imageUrl?: string;
  spotifyUrl?: string;
}

export interface GrailAlbum {
  id: string;
  name: string;
  artist: string;
  imageUrl?: string;
  spotifyUrl?: string;
  releaseDate?: string;
}

export interface GrailsData {
  topTracks: GrailTrack[];
  topAlbums: GrailAlbum[];
}

interface SearchResult {
  id: string;
  name: string;
  artist: string;
  album?: string;
  imageUrl?: string;
  spotifyUrl?: string;
  type: 'track' | 'album';
  releaseDate?: string;
}

interface GrailsSectionProps {
  grailsData?: GrailsData;
  editable?: boolean;
  onGrailsChange?: (grails: GrailsData) => void;
  onEnableEditMode?: () => void;
  theme: 'light' | 'dark';
  spotifyConnected?: boolean;
}

export const GrailsSection: React.FC<GrailsSectionProps> = ({
  grailsData,
  editable = false,
  onGrailsChange,
  onEnableEditMode,
  theme,
  spotifyConnected = false,
}) => {
  const { colors } = useTheme();
  const [searchModal, setSearchModal] = useState<{
    visible: boolean;
    type: 'track' | 'album';
    slotIndex: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [localGrails, setLocalGrails] = useState<GrailsData>({
    topTracks: [],
    topAlbums: [],
  });

  // Initialize local state with provided data
  useEffect(() => {
    if (grailsData) {
      setLocalGrails(grailsData);
    }
  }, [grailsData]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || !searchModal) return;

    const searchTimeout = setTimeout(async () => {
      await performSearch(searchQuery, searchModal.type);
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, searchModal?.type]);

  const performSearch = async (query: string, type: 'track' | 'album') => {
    try {
      setSearching(true);
      const response = await SpotifyAPI.search(query, type, 20);
      
      if (response.success) {
        const items = type === 'track' ? response.tracks?.items || [] : response.albums?.items || [];
        const results: SearchResult[] = items.map((item: any) => ({
          id: item.id,
          name: item.name,
          artist: type === 'track' ? item.artists[0]?.name : item.artists[0]?.name,
          album: type === 'track' ? item.album?.name : undefined,
          imageUrl: item.album?.images?.[0]?.url || item.images?.[0]?.url,
          spotifyUrl: item.external_urls?.spotify,
          type: type,
          releaseDate: type === 'album' ? item.release_date : undefined,
        }));
        
        setSearchResults(results);
      }
    } catch (error) {
      logger.error('Search failed:', error);
      Alert.alert('Search Failed', 'Could not search for music. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectItem = (item: SearchResult) => {
    if (!searchModal) return;

    const newGrails = { ...localGrails };
    const { type, slotIndex } = searchModal;

    if (type === 'track') {
      const track: GrailTrack = {
        id: item.id,
        name: item.name,
        artist: item.artist,
        album: item.album || '',
        imageUrl: item.imageUrl,
        spotifyUrl: item.spotifyUrl,
      };
      
      // Ensure array has enough slots
      while (newGrails.topTracks.length <= slotIndex) {
        newGrails.topTracks.push({} as GrailTrack);
      }
      newGrails.topTracks[slotIndex] = track;
    } else {
      const album: GrailAlbum = {
        id: item.id,
        name: item.name,
        artist: item.artist,
        imageUrl: item.imageUrl,
        spotifyUrl: item.spotifyUrl,
        releaseDate: item.releaseDate,
      };
      
      // Ensure array has enough slots
      while (newGrails.topAlbums.length <= slotIndex) {
        newGrails.topAlbums.push({} as GrailAlbum);
      }
      newGrails.topAlbums[slotIndex] = album;
    }

    setLocalGrails(newGrails);
    onGrailsChange?.(newGrails);
    setSearchModal(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveItem = (type: 'track' | 'album', index: number) => {
    const newGrails = { ...localGrails };
    
    if (type === 'track') {
      newGrails.topTracks[index] = {} as GrailTrack;
    } else {
      newGrails.topAlbums[index] = {} as GrailAlbum;
    }
    
    setLocalGrails(newGrails);
    onGrailsChange?.(newGrails);
  };

  const openSearch = (type: 'track' | 'album', slotIndex: number) => {
    if (!editable) {
      // If not editable (e.g., public profile), prevent access to search
      if (onEnableEditMode) {
        // If callback exists, enable edit mode first
        onEnableEditMode();
      }
      return;
    }
    
    setSearchModal({ visible: true, type, slotIndex });
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderGrailSlot = (
    item: GrailTrack | GrailAlbum | undefined,
    index: number,
    type: 'track' | 'album'
  ) => {
    const isEmpty = !item || !item.id;
    const isTrack = type === 'track';

    // Don't render empty slots on public profiles
    if (isEmpty && !editable) {
      return null;
    }

    return (
      <View key={`${type}-${index}`} style={styles.grailSlot}>
        <TouchableOpacity
          style={[
            styles.grailCard,
            isEmpty && styles.emptyGrailCard,
            isEmpty && editable && styles.discreetEmptyCard,
            { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }
          ]}
          onPress={() => editable && openSearch(type, index)}
          activeOpacity={editable ? 0.7 : 1}
          disabled={!editable}
        >
          {isEmpty ? (
            editable && (
              <View style={styles.emptySlot}>
                <Feather name="plus" size={16} color={colors.textMuted} />
                <Text style={[styles.emptyText, styles.discreetText, { color: colors.textMuted }]}>
                  Add {isTrack ? 'Song' : 'Album'}
                </Text>
              </View>
            )
          ) : (
            <>
              <View style={styles.artworkContainer}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.artwork} />
                ) : (
                  <View style={[styles.artwork, styles.placeholderArt, { backgroundColor: colors.borders.default }]}>
                    <FontAwesome name="music" size={16} color={colors.textSecondary} />
                  </View>
                )}
                
                {editable && (
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)' }]}
                    onPress={() => handleRemoveItem(type, index)}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={10} color={theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)'} />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.grailInfo}>
                <Text style={[styles.grailTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.grailArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.artist}
                </Text>
                {isTrack && (item as GrailTrack).album && (
                  <Text style={[styles.grailAlbum, { color: colors.textMuted }]} numberOfLines={1}>
                    {(item as GrailTrack).album}
                  </Text>
                )}
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.searchResult}
      onPress={() => handleSelectItem(item)}
      activeOpacity={0.6}
    >
      <View style={styles.searchArtwork}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.searchImage} />
        ) : (
          <View style={[styles.searchImage, styles.placeholderArt, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <FontAwesome name="music" size={14} color={colors.textSecondary} />
          </View>
        )}
      </View>
      
      <View style={styles.searchInfo}>
        <Text style={[styles.searchTitle, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.searchArtist, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.artist}
        </Text>
        {item.album && (
          <Text style={[styles.searchAlbum, { color: colors.textMuted }]} numberOfLines={1}>
            {item.album}
          </Text>
        )}
      </View>
      
      <View style={[styles.spotifyIcon, { backgroundColor: theme === 'dark' ? 'rgba(29,185,84,0.1)' : 'rgba(29,185,84,0.05)' }]}>
        <FontAwesome name="spotify" size={14} color="#1DB954" />
      </View>
    </TouchableOpacity>
  );

  // Don't render anything if Spotify isn't connected
  if (!spotifyConnected) {
    // If editable (own profile), show connect tip
    // If not editable (public profile), show nothing
    if (!editable) {
      return null;
    }
    
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textSecondary }]}>Grails</Text>
            <Feather name="disc" size={14} color="#10B981" />
          </View>
          <FadedBorder theme={theme} />
        </View>
        
        <View style={styles.connectTipContainer}>
          <Text style={[styles.connectTip, { color: colors.textMuted }]}>
            Connect Spotify to showcase your all-time favorite songs and albums
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textSecondary }]}>Grails</Text>
          <Feather name="disc" size={14} color="#10B981" />
        </View>
        <FadedBorder theme={theme} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Top Tracks */}
        {(() => {
          const trackSlots = [0, 1, 2]
            .map(index => renderGrailSlot(localGrails.topTracks[index], index, 'track'))
            .filter(slot => slot !== null);
          
          // Only show section if there are tracks to display or if editable
          if (trackSlots.length > 0 || editable) {
            return (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Songs</Text>
                <View style={styles.grailGrid}>
                  {trackSlots}
                </View>
              </View>
            );
          }
          return null;
        })()}

        {/* Top Albums */}
        {(() => {
          const albumSlots = [0, 1, 2]
            .map(index => renderGrailSlot(localGrails.topAlbums[index], index, 'album'))
            .filter(slot => slot !== null);
          
          // Only show section if there are albums to display or if editable
          if (albumSlots.length > 0 || editable) {
            return (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Albums</Text>
                <View style={styles.grailGrid}>
                  {albumSlots}
                </View>
              </View>
            );
          }
          return null;
        })()}
      </View>

      {/* Search Modal */}
      <Modal
        visible={searchModal?.visible || false}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSearchModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff' }]}>
            {/* Header with close button */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add {searchModal?.type === 'track' ? 'Song' : 'Album'}
              </Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => setSearchModal(null)}
              >
                <Feather name="x" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <View style={[styles.searchInputContainer, { 
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }]}>
                <Feather name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={`Search ${searchModal?.type === 'track' ? 'songs' : 'albums'}...`}
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                  >
                    <Feather name="x" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Loading State */}
            {searching && (
              <View style={styles.loadingContainer}>
                <LottieLoader size="small" />
              </View>
            )}

            {/* Results */}
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.id}
                style={styles.searchResults}
                contentContainerStyle={styles.searchResultsContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
              />
            )}
            
            {/* Empty state */}
            {!searching && searchQuery.length > 0 && searchResults.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No results found for "{searchQuery}"
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    marginHorizontal: spacing[2],
    marginTop: spacing[4],
  },
  headerContainer: {
    marginBottom: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing[2],
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing[1],
  },
  content: {
    gap: spacing[6],
  },
  connectTipContainer: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  connectTip: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
    lineHeight: 16,
  },
  section: {
    gap: spacing[3],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing[1],
  },
  grailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  grailSlot: {
    flex: 1,
  },
  grailCard: {
    borderRadius: 8,
    padding: spacing[2],
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emptyGrailCard: {
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  discreetEmptyCard: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[1],
  },
  emptyText: {
    fontSize: 10,
    textAlign: 'center',
  },
  discreetText: {
    fontSize: 9,
    opacity: 0.7,
  },
  artworkContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  artwork: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  placeholderArt: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grailInfo: {
    alignItems: 'center',
    gap: 2,
  },
  grailTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  grailArtist: {
    fontSize: 9,
    textAlign: 'center',
  },
  grailAlbum: {
    fontSize: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    height: '80%',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  clearButton: {
    padding: spacing[1],
    marginLeft: spacing[1],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  searchResults: {
    flex: 1,
    minHeight: 200,
  },
  searchResultsContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
    flexGrow: 1,
  },
  emptyState: {
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[1],
  },
  searchArtwork: {
    marginRight: spacing[3],
  },
  searchImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  searchInfo: {
    flex: 1,
    gap: 2,
  },
  searchTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  searchArtist: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  searchAlbum: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  spotifyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GrailsSection;