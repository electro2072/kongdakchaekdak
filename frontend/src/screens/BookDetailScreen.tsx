import React, {useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import type {ImagePickerResponse} from 'react-native-image-picker';
import {
  BookOpen,
  Camera,
  Image as ImageIcon,
  PenLine,
  MoreHorizontal,
  Plus,
  Trash2,
  CheckCircle,
  Share2,
} from 'lucide-react-native';
import type {MainStackParamList} from '../navigation/types';
import {useLibrary} from '../navigation/LibraryContext';
import type {LibraryNote, LibraryPhoto} from '../mocks/libraryBooks';
import {useTheme} from '../theme';
import {useToast} from '../components/Toast';
import {ActionSheet} from '../components/ActionSheet';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {PromptDialog} from '../components/PromptDialog';

/** 오늘/기록 날짜를 "YYYY.MM.DD" 형식으로 — BookRegisterConfirmScreen과 동일한 표기 */
function formatDateDot(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}.${m}.${d}`;
}

/**
 * 사진 업로드 중 자리 표시 — LoadingSkeleton과 동일한 pulse 방식이지만 66x66 정사각형
 * 썸네일 한 칸용으로 별도 구현(재사용 시 리스트 카드 레이아웃 전제라 맞지 않았음).
 */
function PhotoSkeletonTile() {
  const {colors} = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.photoBox, {opacity, backgroundColor: colors.n200}]}
    />
  );
}

/** Frame 03.1 · 서재 탭(책 상세) — design/hifi_mockup_v1.html 기준. 탭바 없이 전체화면으로 push된다 */
export function BookDetailScreen() {
  const {colors, typography, radii} = useTheme();
  const route = useRoute<RouteProp<MainStackParamList, 'BookDetail'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {
    books,
    addPhoto,
    deletePhoto,
    deleteNote,
    loadBookDetail,
    completeBook,
  } = useLibrary();
  const {showToast} = useToast();
  const bookId = route.params.bookId;
  const book = books.find(b => b.id === bookId);

  const isDone = book?.status === 'done';
  const [isCompleting, setIsCompleting] = useState(false);

  // 목록 조회(GET /api/books)는 소감·장소사진을 주지 않으므로 상세 진입 시 따로 받아온다.
  // 실패해도 책 본문은 이미 목록에서 받아둔 값으로 보이므로 토스트만 띄우고 화면은 유지한다.
  useEffect(() => {
    loadBookDetail(bookId).catch(() => {
      showToast({type: 'error', message: '소감과 사진을 불러오지 못했어요'});
    });
    // 화면을 다시 열 때마다 최신 상태로 맞춘다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const handleComplete = async () => {
    if (isCompleting) {
      return;
    }
    setIsCompleting(true);
    try {
      await completeBook(bookId);
      showToast({type: 'success', message: '완독 처리했어요'});
    } catch (e) {
      showToast({
        type: 'error',
        message:
          e instanceof Error
            ? e.message
            : '완독 처리에 실패했어요. 다시 시도해주세요.',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // 장소 사진 추가 흐름 — claude/독서기록앱_프론트요청_디자인_소감작성화면_장소사진추가화면_v1.md
  // 디자인 회신(2026-09-07) 기준: "+" 타일 → 액션시트(카메라/앨범) → 선택 직후 입력형
  // 다이얼로그로 장소 라벨(선택) 입력 → 백그라운드 업로드.
  const [photoSourceSheetVisible, setPhotoSourceSheetVisible] = useState(false);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [photoLabelInput, setPhotoLabelInput] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoActionTarget, setPhotoActionTarget] =
    useState<LibraryPhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<LibraryPhoto | null>(null);

  // 소감 목록 액션(수정/삭제) — 2026-09-08, BookNote가 목록 구조로 확정된 것 반영
  const [noteActionTarget, setNoteActionTarget] = useState<LibraryNote | null>(
    null,
  );
  const [noteToDelete, setNoteToDelete] = useState<LibraryNote | null>(null);

  if (!book) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.surface}]}>
        <Text
          style={[
            typography.caption,
            {color: colors.n600, textAlign: 'center', marginTop: 40},
          ]}>
          책 정보를 찾을 수 없어요
        </Text>
      </SafeAreaView>
    );
  }

  /**
   * 이미지 피커 응답 공통 처리. 예전엔 uri가 있을 때만 보고 나머지는 전부 무시해서, 권한 거부나
   * 카메라 사용 불가 같은 실패가 "시트만 닫히고 아무 일도 안 일어남"으로 보였다. 사용자가 직접
   * 취소한 경우(didCancel)만 조용히 넘기고, 나머지 실패는 반드시 토스트로 알린다.
   */
  const handlePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }
    if (response.errorCode) {
      const message =
        response.errorCode === 'camera_unavailable'
          ? '이 기기에서는 카메라를 쓸 수 없어요'
          : response.errorCode === 'permission'
          ? '사진 권한이 필요해요. 설정에서 허용해주세요'
          : response.errorMessage ?? '사진을 가져오지 못했어요';
      showToast({type: 'error', message});
      return;
    }
    const uri = response.assets?.[0]?.uri;
    if (uri) {
      setPendingPhotoUri(uri);
    } else {
      showToast({type: 'error', message: '사진을 가져오지 못했어요'});
    }
  };

  const handlePickFromCamera = () => {
    setPhotoSourceSheetVisible(false);
    launchCamera({mediaType: 'photo', quality: 0.8}, handlePickerResponse);
  };

  const handlePickFromLibrary = () => {
    setPhotoSourceSheetVisible(false);
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.8},
      handlePickerResponse,
    );
  };

  const finishAddPhoto = async (label?: string) => {
    const uri = pendingPhotoUri;
    setPendingPhotoUri(null);
    setPhotoLabelInput('');
    if (!uri) {
      return;
    }
    setIsUploadingPhoto(true);
    try {
      // addPhoto 내부가 presigned-url 발급 → S3 PUT → POST .../photos 3단계를 처리한다.
      await addPhoto(book.id, {uri, label: label?.trim() || undefined});
      showToast({type: 'success', message: '사진을 추가했어요'});
    } catch (e) {
      showToast({
        type: 'error',
        message:
          e instanceof Error
            ? e.message
            : '사진 업로드에 실패했어요. 다시 시도해주세요.',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.surface}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.coverBox, {backgroundColor: colors.p50}]}>
            {book.coverImage ? (
              <Image
                source={{uri: book.coverImage}}
                style={styles.coverImage}
              />
            ) : (
              <BookOpen size={26} color={colors.p400} />
            )}
          </View>
          <View style={styles.headerText}>
            <Text
              style={[
                typography.bodyStrong,
                {color: colors.n900, fontSize: 14},
              ]}>
              {book.title}
            </Text>
            <Text
              style={[
                typography.caption,
                {color: colors.n600, marginTop: 3, marginBottom: 8},
              ]}>
              {book.author}
            </Text>
            <Text
              style={[typography.caption, {color: colors.n600, fontSize: 10}]}>
              읽은 기간{'\n'}
              <Text
                style={{color: colors.n900, fontSize: 11, fontWeight: '700'}}>
                {book.dateRangeLabel}
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Camera size={13} color={colors.n600} />
            <Text style={[typography.caption, {color: colors.n600}]}>
              장소 사진
            </Text>
          </View>
          {book.photos.length > 0 ? (
            <Text
              style={[
                typography.caption,
                {color: colors.n500, fontSize: 10.5, marginBottom: 6},
              ]}>
              사진을 길게 누르면 삭제할 수 있어요
            </Text>
          ) : null}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoRow}>
            <TouchableOpacity
              testID="add-photo-tile"
              style={[
                styles.photoBox,
                styles.addPhotoTile,
                {borderColor: colors.n300, backgroundColor: colors.n50},
              ]}
              onPress={() => setPhotoSourceSheetVisible(true)}>
              <Plus size={24} color={colors.n500} />
            </TouchableOpacity>
            {book.photos.map(photo => (
              <View key={photo.id} style={styles.photoItem}>
                <TouchableOpacity
                  testID={`photo-thumb-${photo.id}`}
                  style={[styles.photoBox, {backgroundColor: colors.p50}]}
                  onLongPress={() => setPhotoActionTarget(photo)}>
                  {photo.uri ? (
                    <Image
                      source={{uri: photo.uri}}
                      style={styles.photoImage}
                    />
                  ) : (
                    <ImageIcon size={22} color={colors.p400} />
                  )}
                </TouchableOpacity>
                {photo.label ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      typography.caption,
                      {color: colors.n500, marginTop: 3, fontSize: 9},
                    ]}>
                    {photo.label}
                  </Text>
                ) : null}
              </View>
            ))}
            {isUploadingPhoto ? <PhotoSkeletonTile /> : null}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <PenLine size={13} color={colors.n600} />
            <Text style={[typography.caption, {color: colors.n600}]}>소감</Text>
          </View>
          <TouchableOpacity
            testID="add-note-button"
            style={[
              styles.noteAddButton,
              {borderColor: colors.n300, borderRadius: radii.pill},
            ]}
            onPress={() =>
              navigation.navigate('BookNoteEdit', {bookId: book.id})
            }>
            <PenLine size={13} color={colors.n700} />
            <Text
              style={[
                typography.button,
                {color: colors.n700, fontSize: 11.5, marginLeft: 4},
              ]}>
              소감 작성하기
            </Text>
          </TouchableOpacity>

          {book.notes.length === 0 ? (
            <Text
              style={[typography.caption, {color: colors.n500, marginTop: 8}]}>
              아직 작성한 소감이 없어요
            </Text>
          ) : (
            <View style={styles.noteList}>
              {book.notes.map(note => (
                <View
                  key={note.id}
                  style={[
                    styles.noteCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.hairline,
                      borderRadius: radii.card,
                    },
                  ]}>
                  <View style={styles.noteCardHeader}>
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: colors.n700,
                          fontSize: 10.5,
                          lineHeight: 17,
                          flex: 1,
                        },
                      ]}>
                      {note.content}
                    </Text>
                    <TouchableOpacity
                      testID={`note-more-${note.id}`}
                      style={styles.noteMoreButton}
                      onPress={() => setNoteActionTarget(note)}>
                      <MoreHorizontal size={17} color={colors.n600} />
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={[
                      typography.caption,
                      {color: colors.n500, fontSize: 10.5, marginTop: 6},
                    ]}>
                    {formatDateDot(new Date(note.createdAt))}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {!isDone && (
          <TouchableOpacity
            style={[
              styles.outlineButton,
              {borderColor: colors.p700, borderRadius: radii.md},
            ]}
            onPress={handleComplete}
            disabled={isCompleting}>
            <CheckCircle size={15} color={colors.p700} />
            <Text style={[typography.button, {color: colors.p700}]}>
              {isCompleting ? '처리하는 중…' : '다 읽었어요 (완독 처리)'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            {backgroundColor: colors.accentSolidBg, borderRadius: radii.pill},
          ]}
          onPress={() =>
            navigation.navigate('Tabs', {
              screen: 'Share',
              params: {bookId: book.id},
            })
          }>
          <Share2 size={15} color={colors.onAccentSolid} />
          <Text style={[typography.button, {color: colors.onAccentSolid}]}>
            이 책 공유하기
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ActionSheet
        visible={photoSourceSheetVisible}
        options={[
          {
            key: 'camera',
            label: '카메라로 촬영',
            icon: Camera,
            onPress: handlePickFromCamera,
          },
          {
            key: 'library',
            label: '앨범에서 선택',
            icon: ImageIcon,
            onPress: handlePickFromLibrary,
          },
        ]}
        onCancel={() => setPhotoSourceSheetVisible(false)}
      />

      <PromptDialog
        visible={pendingPhotoUri !== null}
        title="촬영 장소를 입력해주세요"
        message="입력하지 않아도 사진은 등록돼요"
        placeholder="예: 홍대 카페"
        value={photoLabelInput}
        onChangeText={setPhotoLabelInput}
        onSkip={() => finishAddPhoto(undefined)}
        onSave={() => finishAddPhoto(photoLabelInput)}
      />

      <ActionSheet
        visible={photoActionTarget !== null}
        options={[
          {
            key: 'delete',
            label: '삭제하기',
            icon: Trash2,
            danger: true,
            onPress: () => {
              const target = photoActionTarget;
              setPhotoActionTarget(null);
              if (target) {
                setPhotoToDelete(target);
              }
            },
          },
        ]}
        onCancel={() => setPhotoActionTarget(null)}
      />

      <ConfirmDialog
        visible={photoToDelete !== null}
        title="사진을 삭제할까요?"
        message="삭제한 사진은 되돌릴 수 없어요"
        cancelLabel="취소"
        confirmLabel="삭제하기"
        danger
        onCancel={() => setPhotoToDelete(null)}
        onConfirm={() => {
          const target = photoToDelete;
          setPhotoToDelete(null);
          if (target) {
            deletePhoto(book.id, target.id)
              .then(() =>
                showToast({type: 'success', message: '사진을 삭제했어요'}),
              )
              .catch(() =>
                showToast({type: 'error', message: '사진 삭제에 실패했어요'}),
              );
          }
        }}
      />

      <ActionSheet
        visible={noteActionTarget !== null}
        options={[
          {
            key: 'edit',
            label: '수정하기',
            icon: PenLine,
            onPress: () => {
              const target = noteActionTarget;
              setNoteActionTarget(null);
              if (target) {
                navigation.navigate('BookNoteEdit', {
                  bookId: book.id,
                  noteId: target.id,
                });
              }
            },
          },
          {
            key: 'delete',
            label: '삭제하기',
            icon: Trash2,
            danger: true,
            onPress: () => {
              const target = noteActionTarget;
              setNoteActionTarget(null);
              if (target) {
                setNoteToDelete(target);
              }
            },
          },
        ]}
        onCancel={() => setNoteActionTarget(null)}
      />

      <ConfirmDialog
        visible={noteToDelete !== null}
        title="소감을 삭제할까요?"
        message="삭제한 소감은 되돌릴 수 없어요"
        cancelLabel="취소"
        confirmLabel="삭제하기"
        danger
        onCancel={() => setNoteToDelete(null)}
        onConfirm={() => {
          const target = noteToDelete;
          setNoteToDelete(null);
          if (target) {
            deleteNote(book.id, target.id)
              .then(() =>
                showToast({type: 'success', message: '소감을 삭제했어요'}),
              )
              .catch(() =>
                showToast({type: 'error', message: '소감 삭제에 실패했어요'}),
              );
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coverBox: {
    width: 66,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
    paddingTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 7,
  },
  photoItem: {
    alignItems: 'center',
  },
  photoBox: {
    width: 66,
    height: 66,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  addPhotoTile: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noteAddButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  noteList: {
    marginTop: 10,
    gap: 8,
  },
  noteCard: {
    borderWidth: 1,
    padding: 12,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteMoreButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  outlineButton: {
    height: 38,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  primaryButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
