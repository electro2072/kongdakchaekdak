package com.kongdakchaekdak.domain.bookphoto;

import java.net.URI;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * (G16 회원 탈퇴, 2026-09-11) {@link BookPhoto#getImageUrl()}에서 스토리지 오브젝트 key를 되찾는다.
 *
 * <p>DB에는 key가 아니라 공개 URL만 저장돼 있다({@code BookPhotoService.buildPublicUrl}). 호스트는
 * 스토리지 설정(AWS → R2, G2)에 따라 바뀌므로 보지 않고, 경로에서 이 서버가 발급하는 key 형식
 * {@code book-photos/{bookId}/{uuid}{.ext}}만 인정한다.
 *
 * <p><b>bookId까지 대조하는 이유:</b> {@code imageUrl}은 클라이언트가 보낸 값이라 남의 책 경로를
 * 넣을 수 있다. 사진이 실제로 속한 책의 접두사와 일치할 때만 key로 인정해야 탈퇴가 남의 오브젝트를
 * 지우는 통로가 되지 않는다. 형식이 맞지 않으면 지우지 않는다(남는 쪽이 안전한 실패).
 */
public final class BookPhotoObjectKeys {

    // BookPhotoService.buildObjectKey / extractSafeExtension 규칙과 맞춘다: UUID + 선택적 확장자.
    private static final String KEY_TAIL = "[A-Za-z0-9-]+(?:\\.[a-z0-9]{1,10})?";

    private BookPhotoObjectKeys() {
    }

    public static Optional<String> fromImageUrl(Long bookId, String imageUrl) {
        if (bookId == null || imageUrl == null || imageUrl.isBlank()) {
            return Optional.empty();
        }
        String path;
        try {
            path = URI.create(imageUrl.trim()).getPath();
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
        if (path == null) {
            return Optional.empty();
        }
        // virtual-hosted(/book-photos/..) 와 path-style(/{bucket}/book-photos/..) 둘 다 허용.
        Pattern pattern = Pattern.compile("(?:^|/)(book-photos/" + bookId + "/" + KEY_TAIL + ")$");
        Matcher matcher = pattern.matcher(path);
        return matcher.find() ? Optional.of(matcher.group(1)) : Optional.empty();
    }
}
