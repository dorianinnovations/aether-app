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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';
import { FadedBorder } from '../../../components/FadedBorder';
import { SpotifyAPI } from '../../../services/api';
import { logger } from '../../../utils/logger';

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
    if (!editable && onEnableEditMode) {
      // If not in edit mode, enable edit mode first
      onEnableEditMode();
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

    return (
      <View key={`${type}-${index}`} style={styles.grailSlot}>
        <TouchableOpacity
          style={[
            styles.grailCard,
            isEmpty && styles.emptyGrailCard,
            { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' }
          ]}
          onPress={() => openSearch(type, index)}
          activeOpacity={0.7}
        >
          {isEmpty ? (
            <View style={styles.emptySlot}>
              <Feather name="plus" size={20} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Add {isTrack ? 'Song' : 'Album'}
              </Text>
            </View>
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
      style={[styles.searchResult, { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}
      onPress={() => handleSelectItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.searchArtwork}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.searchImage} />
        ) : (
          <View style={[styles.searchImage, styles.placeholderArt, { backgroundColor: colors.borders.default }]}>
            <FontAwesome name="music" size={12} color={colors.textSecondary} />
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
      
      <FontAwesome name="spotify" size={16} color="#1DB954" />
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
            <Feather name="star" size={14} color="#FFD700" />
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
          <Feather name="star" size={14} color="#FFD700" />
        </View>
        <FadedBorder theme={theme} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Top Tracks */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Songs</Text>
          <View style={styles.grailGrid}>
            {[0, 1, 2].map(index => 
              renderGrailSlot(localGrails.topTracks[index], index, 'track')
            )}
          </View>
        </View>

        {/* Top Albums */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Albums</Text>
          <View style={styles.grailGrid}>
            {[0, 1, 2].map(index => 
              renderGrailSlot(localGrails.topAlbums[index], index, 'album')
            )}
          </View>
        </View>
      </View>

      {/* Search Modal */}
      <Modal
        visible={searchModal?.visible || false}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSearchModal(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.borders.default }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSearchModal(null)}
            >
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Search {searchModal?.type === 'track' ? 'Songs' : 'Albums'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: colors.text,
                }
              ]}
              placeholder={`Search for ${searchModal?.type === 'track' ? 'songs' : 'albums'}...`}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          {searching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1DB954" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Searching...</Text>
            </View>
          )}

          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            style={styles.searchResults}
            showsVerticalScrollIndicator={false}
          />
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing[1],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: 16,
  },
  loadingContainer: {
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[2],
  },
  loadingText: {
    fontSize: 14,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    marginVertical: spacing[1],
    borderRadius: 8,
  },
  searchArtwork: {
    marginRight: spacing[3],
  },
  searchImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  searchInfo: {
    flex: 1,
    gap: 2,
  },
  searchTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchArtist: {
    fontSize: 12,
  },
  searchAlbum: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default GrailsSection;