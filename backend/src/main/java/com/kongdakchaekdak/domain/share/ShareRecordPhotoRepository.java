package com.kongdakchaekdak.domain.share;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShareRecordPhotoRepository extends JpaRepository<ShareRecordPhoto, Long> {

    List<ShareRecordPhoto> findByShareRecordIdOrderByDisplayOrderAsc(Long shareRecordId);

    void deleteByShareRecordId(Long shareRecordId);
}
