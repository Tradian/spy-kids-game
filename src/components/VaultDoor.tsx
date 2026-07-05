import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';

interface Props {
  /** Fired when the doors have fully opened. */
  onOpened: () => void;
  /** Scroll missions open a scroll instead of a steel vault. */
  scroll?: boolean;
}

/**
 * The payoff moment: wheel spins, doors slide apart. Sprint 1 says this is
 * where the polish budget goes once the kids react to it.
 */
export function VaultDoor({ onOpened, scroll }: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const doors = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(spin, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(doors, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onOpened();
    });
  }, [spin, doors, onOpened]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });
  const leftX = doors.interpolate({ inputRange: [0, 1], outputRange: [0, -220] });
  const rightX = doors.interpolate({ inputRange: [0, 1], outputRange: [0, 220] });
  const wheelFade = doors.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0, 0] });

  const doorColor = scroll ? colors.scrollPanel : colors.bgRaised;
  const edgeColor = scroll ? colors.parchment : colors.gold;

  return (
    <View style={styles.frame}>
      <Animated.View
        style={[styles.door, { backgroundColor: doorColor, borderColor: edgeColor, left: 0, transform: [{ translateX: leftX }] }]}
      />
      <Animated.View
        style={[styles.door, { backgroundColor: doorColor, borderColor: edgeColor, right: 0, transform: [{ translateX: rightX }] }]}
      />
      <Animated.View style={[styles.wheel, { opacity: wheelFade, transform: [{ rotate }] }]}>
        <Text style={styles.wheelEmoji}>{scroll ? '📜' : '🛞'}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    height: 300,
    borderRadius: radii.panel,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgDeep,
  },
  door: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    borderWidth: 4,
  },
  wheel: { position: 'absolute' },
  wheelEmoji: { fontSize: 90 },
});
