import { useRef, useEffect } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

interface SettingsModalAnimations {
  // Animation values
  subDrawerAnim: Animated.Value;
  mainContentAnim: Animated.Value;
  headerOpacity: Animated.Value;
  accountSectionOpacity: Animated.Value;
  categoriesSectionOpacity: Animated.Value;
  quickActionsOpacity: Animated.Value;
  accountButtonOpacity: Animated.Value;
  categoryButtonAnims: Animated.Value[];
  quickActionAnims: Animated.Value[];
  subDrawerHeaderOpacity: Animated.Value;
  subDrawerItemsOpacity: Animated.Value;
  
  // Animation controls
  openSubDrawer: (section: string) => void;
  closeSubDrawer: () => void;
}

export const useSettingsModalAnimations = (
  visible: boolean,
  activeSubDrawer: string | null,
  setActiveSubDrawer: (section: string | null) => void
): SettingsModalAnimations => {
  // Animation refs
  const subDrawerAnim = useRef(new Animated.Value(0)).current;
  const mainContentAnim = useRef(new Animated.Value(0)).current;
  
  // Staggered animation refs for settings modal
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const accountSectionOpacity = useRef(new Animated.Value(0)).current;
  const categoriesSectionOpacity = useRef(new Animated.Value(0)).current;
  const quickActionsOpacity = useRef(new Animated.Value(0)).current;
  
  // Individual button animations
  const accountButtonOpacity = useRef(new Animated.Value(0)).current;
  const categoryButtonAnims = useRef([
    new Animated.Value(0), 
    new Animated.Value(0), 
    new Animated.Value(0), 
    new Animated.Value(0), 
    new Animated.Value(0)
  ]).current;
  const quickActionAnims = useRef([
    new Animated.Value(0), 
    new Animated.Value(0)
  ]).current;
  
  // Sub-drawer animation refs
  const subDrawerHeaderOpacity = useRef(new Animated.Value(0)).current;
  const subDrawerItemsOpacity = useRef(new Animated.Value(0)).current;
  
  // Timeout refs for cleanup
  const animationTimeouts = useRef<NodeJS.Timeout[]>([]).current;

  // Cleanup animation timeouts on unmount
  useEffect(() => {
    return () => {
      animationTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Animate modal content in when visible
  useEffect(() => {
    if (visible) {
      // Haptic feedback when modal opens
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      animateModalSequence();
    } else {
      // Reset all animations when modal is hidden
      headerOpacity.setValue(0);
      accountSectionOpacity.setValue(0);
      categoriesSectionOpacity.setValue(0);
      quickActionsOpacity.setValue(0);
      
      // Reset individual button animations
      accountButtonOpacity.setValue(0);
      categoryButtonAnims.forEach(anim => anim.setValue(0));
      quickActionAnims.forEach(anim => anim.setValue(0));
    }
  }, [visible]);

  // Animate sub-drawer content when opened
  useEffect(() => {
    if (activeSubDrawer) {
      animateSubDrawerSequence();
    } else {
      // Reset sub-drawer animations
      subDrawerHeaderOpacity.setValue(0);
      subDrawerItemsOpacity.setValue(0);
    }
  }, [activeSubDrawer]);

  // Staggered animation sequence for main modal
  const animateModalSequence = () => {
    // Header first (100ms delay)
    const headerTimeout = setTimeout(() => {
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 100);
    animationTimeouts.push(headerTimeout);

    // Account section (200ms delay)
    const accountTimeout = setTimeout(() => {
      Animated.timing(accountSectionOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
      
      // Account button animation
      const accountButtonTimeout = setTimeout(() => {
        Animated.timing(accountButtonOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }, 40);
      animationTimeouts.push(accountButtonTimeout);
    }, 200);
    animationTimeouts.push(accountTimeout);

    // Categories section (300ms delay)
    const categoriesTimeout = setTimeout(() => {
      Animated.timing(categoriesSectionOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Sequential category button animations
      categoryButtonAnims.forEach((anim, index) => {
        const buttonTimeout = setTimeout(() => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }).start();
        }, 60 + (index * 40));
        animationTimeouts.push(buttonTimeout);
      });
    }, 300);
    animationTimeouts.push(categoriesTimeout);

    // Quick actions (450ms delay)
    const quickActionsTimeout = setTimeout(() => {
      Animated.timing(quickActionsOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
      
      // Sequential quick action animations
      quickActionAnims.forEach((anim, index) => {
        const actionTimeout = setTimeout(() => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }).start();
        }, 60 + (index * 40));
        animationTimeouts.push(actionTimeout);
      });
    }, 450);
    animationTimeouts.push(quickActionsTimeout);
  };

  // Staggered animation sequence for sub-drawer
  const animateSubDrawerSequence = () => {
    // Header first (50ms delay)
    const headerTimeout = setTimeout(() => {
      Animated.timing(subDrawerHeaderOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, 50);
    animationTimeouts.push(headerTimeout);

    // Items second (150ms delay)
    const itemsTimeout = setTimeout(() => {
      Animated.timing(subDrawerItemsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 150);
    animationTimeouts.push(itemsTimeout);
  };

  // Sub-drawer animations
  const openSubDrawer = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveSubDrawer(section);
    Animated.parallel([
      Animated.timing(mainContentAnim, {
        toValue: -screenWidth * 0.2,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(subDrawerAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSubDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(mainContentAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(subDrawerAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveSubDrawer(null);
    });
  };

  return {
    // Animation values
    subDrawerAnim,
    mainContentAnim,
    headerOpacity,
    accountSectionOpacity,
    categoriesSectionOpacity,
    quickActionsOpacity,
    accountButtonOpacity,
    categoryButtonAnims,
    quickActionAnims,
    subDrawerHeaderOpacity,
    subDrawerItemsOpacity,
    
    // Animation controls
    openSubDrawer,
    closeSubDrawer,
  };
};