/**
 * GitHubSection - Molecule Component
 * Displays GitHub profile information and repositories
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Design System
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';

// Services
import { GitHubAPI, GitHubRepository, GitHubUser } from '../../../services/apiModules/endpoints/github';

// Utils
import { logger } from '../../../utils/logger';

export interface GitHubSectionProps {
  initialUsername?: string;
  editMode: boolean;
  onUsernameChange?: (username: string | null) => void;
}

export const GitHubSection: React.FC<GitHubSectionProps> = ({
  initialUsername,
  editMode,
  onUsernameChange,
}) => {
  const { theme, colors } = useTheme();
  const [username, setUsername] = useState(initialUsername || '');
  const [loading, setLoading] = useState(false);
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Load GitHub data when username is available
  useEffect(() => {
    if (initialUsername && initialUsername !== username) {
      setUsername(initialUsername);
      loadGitHubData(initialUsername);
    }
  }, [initialUsername]);

  const loadGitHubData = async (githubUsername: string) => {
    if (!githubUsername.trim()) {
      setGithubUser(null);
      setRepositories([]);
      return;
    }

    setLoading(true);
    try {
      // Load user profile and popular repositories in parallel
      const [userProfile, repos] = await Promise.all([
        GitHubAPI.getUserProfile(githubUsername),
        GitHubAPI.getPopularRepositories(githubUsername, 6),
      ]);

      setGithubUser(userProfile);
      setRepositories(repos);
    } catch (error: any) {
      logger.error('Error loading GitHub data:', error);
      setGithubUser(null);
      setRepositories([]);
      
      if (error.message.includes('not found')) {
        Alert.alert('GitHub User Not Found', `The username "${githubUsername}" was not found on GitHub.`);
      } else {
        Alert.alert('Error', 'Failed to load GitHub profile. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    const trimmedUsername = username.trim();
    
    if (trimmedUsername) {
      await loadGitHubData(trimmedUsername);
      // Only call onUsernameChange if the GitHub user was found successfully
      if (githubUser || !trimmedUsername) {
        onUsernameChange?.(trimmedUsername || null);
      }
    } else {
      setGithubUser(null);
      setRepositories([]);
      onUsernameChange?.(null);
    }
  };

  const handleRemoveGitHub = () => {
    Alert.alert(
      'Remove GitHub Profile',
      'Are you sure you want to remove your GitHub profile from Aether?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setUsername('');
            setGithubUser(null);
            setRepositories([]);
            onUsernameChange?.(null);
          },
        },
      ]
    );
  };

  const openRepository = (repo: GitHubRepository) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(repo.html_url);
  };

  const openGitHubProfile = () => {
    if (githubUser) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(githubUser.html_url);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getLanguageColor = (language: string | null): string => {
    const languageColors: Record<string, string> = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      C: '#555555',
      'C#': '#239120',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      Rust: '#dea584',
      Swift: '#ffac45',
      Kotlin: '#F18E33',
      Dart: '#00B4AB',
      HTML: '#e34c26',
      CSS: '#1572B6',
      Vue: '#2c3e50',
      React: '#61DAFB',
    };
    
    return languageColors[language || ''] || '#8B949E';
  };

  if (editMode) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Feather name="github" size={24} color={colors.text} />
          <Text style={[styles.title, { color: colors.text }]}>
            GitHub Profile
          </Text>
        </View>
        
        <View style={styles.editContainer}>
          <Input
            value={username}
            onChangeText={setUsername}
            placeholder="Enter GitHub username"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          
          <View style={styles.editActions}>
            <Button
              variant="secondary"
              size="sm"
              onPress={handleSaveUsername}
              style={styles.saveButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={{ color: colors.text }}>Save</Text>
              )}
            </Button>
            
            {githubUser && (
              <Button
                variant="ghost"
                size="sm"
                onPress={handleRemoveGitHub}
                style={styles.removeButton}
              >
                <Text style={{ color: '#FF6B9D' }}>
                  Remove
                </Text>
              </Button>
            )}
          </View>
        </View>
      </View>
    );
  }

  if (!githubUser) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={openGitHubProfile}
        activeOpacity={0.7}
      >
        <Feather name="github" size={24} color={colors.text} />
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>
            {githubUser.name || githubUser.login}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{githubUser.login}
          </Text>
        </View>
        <Feather name="external-link" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {githubUser.bio && (
        <Text style={[styles.bio, { color: colors.textSecondary }]}>
          {githubUser.bio}
        </Text>
      )}

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {githubUser.public_repos}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Repositories
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {githubUser.followers}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Followers
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {githubUser.following}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Following
          </Text>
        </View>
      </View>

      {repositories.length > 0 && (
        <View style={styles.repositoriesSection}>
          <TouchableOpacity
            style={styles.repositoriesHeader}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setExpanded(!expanded);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.repositoriesTitle, { color: colors.text }]}>
              Popular Repositories
            </Text>
            <Feather 
              name={expanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.repositoriesList}>
              {repositories.slice(0, 3).map((repo) => (
                <TouchableOpacity
                  key={repo.id}
                  style={[styles.repository, { borderBottomColor: colors.borders.default }]}
                  onPress={() => openRepository(repo)}
                  activeOpacity={0.7}
                >
                  <View style={styles.repoHeader}>
                    <Text style={[styles.repoName, { color: colors.text }]}>
                      {repo.name}
                    </Text>
                    <View style={styles.repoStats}>
                      {repo.stargazers_count > 0 && (
                        <View style={styles.repoStat}>
                          <Feather name="star" size={12} color={colors.textSecondary} />
                          <Text style={[styles.repoStatText, { color: colors.textSecondary }]}>
                            {repo.stargazers_count}
                          </Text>
                        </View>
                      )}
                      {repo.language && (
                        <View style={styles.repoStat}>
                          <View 
                            style={[
                              styles.languageDot, 
                              { backgroundColor: getLanguageColor(repo.language) }
                            ]} 
                          />
                          <Text style={[styles.repoStatText, { color: colors.textSecondary }]}>
                            {repo.language}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {repo.description && (
                    <Text 
                      style={[styles.repoDescription, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {repo.description}
                    </Text>
                  )}
                  
                  <Text style={[styles.repoDate, { color: colors.textSecondary }]}>
                    Updated {formatDate(repo.updated_at)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing[4],
    marginVertical: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    fontSize: 18,
  },
  username: {
    marginTop: spacing[1],
  },
  bio: {
    marginTop: spacing[3],
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: '700',
    fontSize: 18,
  },
  statLabel: {
    marginTop: spacing[1],
  },
  editContainer: {
    marginTop: spacing[3],
  },
  input: {
    marginBottom: spacing[3],
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  saveButton: {
    flex: 1,
  },
  removeButton: {
    flex: 1,
  },
  repositoriesSection: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  repositoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repositoriesTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  repositoriesList: {
    marginTop: spacing[3],
  },
  repository: {
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  repoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  repoName: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
  },
  repoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  repoStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  repoStatText: {
    fontSize: 12,
  },
  languageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  repoDescription: {
    marginBottom: spacing[2],
    lineHeight: 18,
  },
  repoDate: {
    fontSize: 11,
  },
});