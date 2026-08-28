package com.kongdakchaekdak.domain.bookphoto;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookPhotoRepository extends JpaRepository<BookPhoto, Long> {

    List<BookPhoto> findByBookIdOrderByCreatedAtDesc(Long bookId);
}
