import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  LayoutChangeEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { THEME } from '../constants/theme';

interface SmoothScrubberProps {
  position: number; // in seconds
  duration: number; // in seconds
  onSeek: (seconds: number) => void;
  formatTime: (secs: number) => string;
}

export const SmoothScrubber: React.FC<SmoothScrubberProps> = ({
  position,
  duration,
  onSeek,
  formatTime,
}) => {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const trackWidthRef = useRef<number>(0);
  const isScrubbingRef = useRef<boolean>(false);
  const lastPosRef = useRef<number>(position);

  // Keep lastPosRef updated
  useEffect(() => {
    lastPosRef.current = position;
  }, [position]);

  const effectiveDuration = duration > 0 ? duration : 1;
  const currentPos = isScrubbing ? scrubPosition : position;
  const progressRatio = Math.min(1, Math.max(0, currentPos / effectiveDuration));
  const progressPercent = progressRatio * 100;

  const calculateSecondsFromTouch = (pageX: number, touchX?: number): number => {
    const width = trackWidthRef.current;
    if (width <= 0) return 0;

    // Use touchX if available, otherwise relative to width
    let targetX = touchX !== undefined ? touchX : 0;
    targetX = Math.max(0, Math.min(width, targetX));
    const ratio = targetX / width;
    return Math.round(ratio * effectiveDuration);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        isScrubbingRef.current = true;
        setIsScrubbing(true);
        const touchX = evt.nativeEvent.locationX;
        const newSecs = calculateSecondsFromTouch(evt.nativeEvent.pageX, touchX);
        setScrubPosition(newSecs);
        Haptics.selectionAsync().catch(() => {});
      },

      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const width = trackWidthRef.current;
        if (width <= 0) return;

        // Calculate based on initial touch + dx delta for ultra-smooth tracking
        const initialX = evt.nativeEvent.locationX - gestureState.dx;
        const currentX = Math.max(0, Math.min(width, initialX + gestureState.dx));
        const ratio = currentX / width;
        const newSecs = Math.round(ratio * effectiveDuration);
        setScrubPosition(newSecs);
      },

      onPanResponderRelease: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const width = trackWidthRef.current;
        const initialX = evt.nativeEvent.locationX - gestureState.dx;
        const currentX = Math.max(0, Math.min(width, initialX + gestureState.dx));
        const ratio = currentX / width;
        const finalSecs = Math.max(0, Math.min(effectiveDuration, Math.round(ratio * effectiveDuration)));

        setIsScrubbing(false);
        isScrubbingRef.current = false;
        onSeek(finalSecs);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },

      onPanResponderTerminate: () => {
        setIsScrubbing(false);
        isScrubbingRef.current = false;
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  };

  return (
    <View style={styles.container}>
      {/* 40px Hit Slop Touch Area */}
      <View
        style={styles.touchArea}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* Background Track */}
        <View style={[styles.trackBackground, isScrubbing && styles.trackBackgroundActive]}>
          {/* Buffered / Inactive line */}
          <View
            style={[
              styles.trackFill,
              { width: `${progressPercent}%` },
              isScrubbing && styles.trackFillActive,
            ]}
          />
        </View>

        {/* Thumb / Knob */}
        <View
          style={[
            styles.thumb,
            { left: `${progressPercent}%` },
            isScrubbing && styles.thumbActive,
          ]}
          pointerEvents="none"
        />
      </View>

      {/* Time Display Row */}
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, isScrubbing && styles.timeTextActive]}>
          {formatTime(currentPos)}
        </Text>
        <Text style={styles.timeText}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 14,
  },
  touchArea: {
    height: 38,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  trackBackgroundActive: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  trackFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: 2,
  },
  trackFillActive: {
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.colors.primary,
    marginLeft: -6,
    top: 13, // (38 - 12) / 2
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  thumbActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
    top: 9, // (38 - 20) / 2
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: -2,
  },
  timeText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  timeTextActive: {
    color: THEME.colors.primary,
    fontWeight: '800',
  },
});
