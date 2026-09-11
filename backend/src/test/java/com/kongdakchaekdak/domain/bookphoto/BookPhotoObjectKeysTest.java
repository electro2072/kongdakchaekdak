package com.kongdakchaekdak.domain.bookphoto;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * (G16 회원 탈퇴, 2026-09-11) 사진 URL → 스토리지 key 추출 규칙.
 *
 * <p>가장 중요한 건 거부 케이스다. {@code imageUrl}은 클라이언트가 보낸 값이므로, 사진이 실제로 속한 책의
 * 접두사가 아니면 key로 인정하지 않아야 탈퇴가 남의 파일을 지우는 통로가 되지 않는다.
 */
class BookPhotoObjectKeysTest {

    private static final String UUID_NAME = "550e8400-e29b-41d4-a716-446655440000";

    @Test
    void virtual_hosted_URL에서_key를_추출한다() {
        String url = "https://test-bucket.s3.ap-northeast-2.amazonaws.com/book-photos/12/" + UUID_NAME + ".jpg";
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, url)).contains("book-photos/12/" + UUID_NAME + ".jpg");
    }

    @Test
    void 호스트가_바뀌거나_path_style이어도_경로로_추출한다() {
        String url = "https://cdn.example.com/my-bucket/book-photos/12/" + UUID_NAME + ".png";
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, url)).contains("book-photos/12/" + UUID_NAME + ".png");
    }

    @Test
    void 확장자가_없거나_쿼리스트링이_붙어도_추출한다() {
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, "https://h/book-photos/12/" + UUID_NAME))
                .contains("book-photos/12/" + UUID_NAME);
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, "https://h/book-photos/12/" + UUID_NAME + ".jpg?X-Amz-Signature=abc"))
                .contains("book-photos/12/" + UUID_NAME + ".jpg");
    }

    @Test
    void 다른_책의_경로면_거부한다() {
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, "https://h/book-photos/13/" + UUID_NAME + ".jpg")).isEmpty();
        // 접두사 일치 함정: bookId=1 이 book-photos/12/ 에 걸리면 안 된다.
        assertThat(BookPhotoObjectKeys.fromImageUrl(1L, "https://h/book-photos/12/" + UUID_NAME + ".jpg")).isEmpty();
    }

    @Test
    void 경로_조작이나_하위_폴더는_거부한다() {
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, "https://h/book-photos/12/../13/" + UUID_NAME + ".jpg")).isEmpty();
        assertThat(BookPhotoObjectKeys.fromImageUrl(13L, "https://h/book-photos/12/../13/" + UUID_NAME + ".jpg")).isEmpty();
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, "https://h/book-photos/12/sub/" + UUID_NAME + ".jpg")).isEmpty();
    }

    @Test
    void 우리_형식이_아니거나_깨진_값이면_거부한다() {
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, "https://example.com/photo1.jpg")).isEmpty();
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, "http://exa mple.com/book-photos/12/a.jpg")).isEmpty();
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, "")).isEmpty();
        assertThat(BookPhotoObjectKeys.fromImageUrl(12L, null)).isEmpty();
        assertThat(BookPhotoObjectKeys.fromImageUrl(null, "https://h/book-photos/12/" + UUID_NAME + ".jpg")).isEmpty();
    }
}
