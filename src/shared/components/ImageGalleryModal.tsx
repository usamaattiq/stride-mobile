import React from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

import { AppText } from './AppText';
import { FocusAwareStatusBar } from './FocusAwareStatusBar';

type ImageGalleryModalProps = {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
};

export function ImageGalleryModal({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: ImageGalleryModalProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const listRef = React.useRef<FlatList<string>>(null);
  const [index, setIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (!visible) {
      return;
    }
    setIndex(initialIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: initialIndex * screenWidth, animated: false });
    });
  }, [visible, initialIndex, screenWidth]);

  const onMomentumScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
      setIndex(next);
    },
    [screenWidth],
  );

  const renderItem = React.useCallback(
    ({ item }: ListRenderItemInfo<string>) => (
      <View style={[styles.page, { width: screenWidth }]}>
        <Image
          source={{ uri: item }}
          style={styles.image}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={item.split('?')[0]}
          transition={0}
        />
      </View>
    ),
    [screenWidth],
  );

  const getItemLayout = React.useCallback(
    (_: ArrayLike<string> | null | undefined, i: number) => ({
      length: screenWidth,
      offset: screenWidth * i,
      index: i,
    }),
    [screenWidth],
  );

  if (!images.length) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <FocusAwareStatusBar style="light" />

        <FlatList
          ref={listRef}
          data={images}
          keyExtractor={(item, i) => `${item.split('?')[0]}-${i}`}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndex}
        />

        <Pressable
          onPress={onClose}
          style={[styles.closeButton, { top: insets.top + spacing.sm }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <FontAwesome name="close" size={18} color={colors.white} />
        </Pressable>

        {images.length > 1 ? (
          <View style={[styles.counter, { top: insets.top + spacing.sm }]} pointerEvents="none">
            <AppText weight="semibold" style={styles.counterText}>
              {`${index + 1} / ${images.length}`}
            </AppText>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  counterText: {
    fontSize: 13,
    color: colors.white,
  },
});
