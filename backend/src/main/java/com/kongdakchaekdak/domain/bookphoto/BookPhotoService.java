package com.kongdakchaekdak.domain.bookphoto;

import com.kongdakchaekdak.common.exception.ForbiddenException;
import com.kongdakchaekdak.common.exception.ResourceNotFoundException;
import com.kongdakchaekdak.config.S3Properties;
import com.kongdakchaekdak.domain.book.Book;
import com.kongdakchaekdak.domain.book.BookRepository;
import com.kongdakchaekdak.domain.bookphoto.dto.BookPhotoCreateRequest;
import com.kongdakchaekdak.domain.bookphoto.dto.BookPhotoResponse;
import com.kongdakchaekdak.domain.bookphoto.dto.PresignedUrlRequest;
import com.kongdakchaekdak.domain.bookphoto.dto.PresignedUrlResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookPhotoService {

    private final BookPhotoRepository bookPhotoRepository;
    private final BookRepository bookRepository;
    private final S3Presigner s3Presigner;
    private final S3Properties s3Properties;

    /**
     * 사진 업로드 1단계 — 클라이언트가 S3에 직접 PUT할 수 있는 presigned URL을 발급한다.
     * 실제 파일 데이터는 이 서버를 거치지 않고 클라이언트→S3로 바로 올라간다(서버 부하/대역폭 절약).
     * 업로드가 끝나면 클라이언트는 응답의 imageUrl로 {@link #create} (2단계)를 호출해서
     * BookPhoto 레코드를 실제로 남겨야 한다 — presigned URL 발급만으로는 DB에 아무것도 기록되지 않는다.
     */
    public PresignedUrlResponse issuePresignedUploadUrl(Long bookId, PresignedUrlRequest request, Long currentUserId) {
        Book book = findBookOrThrow(bookId);
        requireOwner(book, currentUserId);

        String key = buildObjectKey(bookId, request.fileName());
        long expirationSeconds = s3Properties.presignedUrlExpirationSeconds() == null
                ? 600L
                : s3Properties.presignedUrlExpirationSeconds();

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(s3Properties.bucket())
                .key(key)
                .contentType(request.contentType())
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expirationSeconds))
                .putObjectRequest(objectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

        return new PresignedUrlResponse(
                presignedRequest.url().toString(),
                buildPublicUrl(key),
                key,
                expirationSeconds
        );
    }

    @Transactional
    public BookPhotoResponse create(Long bookId, BookPhotoCreateRequest request, Long currentUserId) {
        Book book = findBookOrThrow(bookId);
        requireOwner(book, currentUserId);

        BookPhoto photo = new BookPhoto(book, request.imageUrl(), request.locationText(),
                request.latitude(), request.longitude());
        return BookPhotoResponse.from(bookPhotoRepository.save(photo));
    }

    // 책 상세 페이지에서 사진을 구경하는 건 다른 회원도 가능해야 하는 조회 기능이라
    // (User/Book의 조회 API와 동일한 설계 원칙) 소유자 검증 없이 열어둔다. 다만 URL 경로 자체가
    // 특정 책에 종속된 하위 리소스(/api/books/{bookId}/photos)라, 그 책이 아예 없으면 404로 응답한다
    // (BookService.search의 필터용 userId와 달리, 여기 bookId는 경로상 리소스 식별자이기 때문).
    public List<BookPhotoResponse> list(Long bookId) {
        findBookOrThrow(bookId);
        return bookPhotoRepository.findByBookIdOrderByCreatedAtDesc(bookId).stream()
                .map(BookPhotoResponse::from)
                .toList();
    }

    @Transactional
    public void delete(Long bookId, Long photoId, Long currentUserId) {
        BookPhoto photo = bookPhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("사진을 찾을 수 없습니다. id=" + photoId));

        if (!photo.getBook().getId().equals(bookId)) {
            throw new ResourceNotFoundException("해당 책 기록에 속한 사진이 아닙니다. bookId=" + bookId + ", photoId=" + photoId);
        }
        requireOwner(photo.getBook(), currentUserId);

        bookPhotoRepository.delete(photo);
    }

    private Book findBookOrThrow(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("책 기록을 찾을 수 없습니다. id=" + bookId));
    }

    // 본인 소유의 책에만 사진을 등록/삭제할 수 있도록 강제한다 (BookService의 소유자 검증과 동일한 원칙).
    private void requireOwner(Book book, Long currentUserId) {
        if (!book.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("본인 책 기록에만 사진을 추가/삭제할 수 있습니다.");
        }
    }

    // 원본 파일명을 그대로 S3 key에 쓰면 경로 조작(예: "../../secret")이나 특수문자 문제가 생길 수
    // 있어, 확장자만 뽑아내고 나머지는 UUID로 대체한다. 확장자가 없거나 이상한 형식이면 버린다.
    private String buildObjectKey(Long bookId, String fileName) {
        String extension = extractSafeExtension(fileName);
        return "book-photos/" + bookId + "/" + UUID.randomUUID() + extension;
    }

    private String extractSafeExtension(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return "";
        }
        String extension = fileName.substring(dotIndex).toLowerCase();
        return extension.matches("\\.[a-z0-9]{1,10}") ? extension : "";
    }

    // 버킷이 퍼블릭 읽기로 설정되어 있거나 CloudFront 등을 앞단에 둘 것을 전제로 한 표준
    // virtual-hosted-style URL. 버킷을 private으로 유지하고 별도 CDN/서명된 GET URL을 쓰기로
    // 하면 이 메서드를 그에 맞게 교체해야 한다 (TODO, Step 5 카드 이미지 공개 웹뷰 설계 시 재검토).
    private String buildPublicUrl(String key) {
        return "https://" + s3Properties.bucket() + ".s3." + s3Properties.region() + ".amazonaws.com/" + key;
    }
}
