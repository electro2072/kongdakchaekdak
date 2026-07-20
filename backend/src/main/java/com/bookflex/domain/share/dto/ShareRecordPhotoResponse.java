package com.bookflex.domain.share.dto;

import com.bookflex.domain.share.ShareRecordPhoto;

/** 공유 카드/공개 웹페이지에 노출할, 공유 시 선택한 사진 (순서대로). */
public record ShareRecordPhotoResponse(Long photoId, String imageUrl, int displayOrder) {

    public static ShareRecordPhotoResponse from(ShareRecordPhoto photo) {
        return new ShareRecordPhotoResponse(
                photo.getBookPhoto().getId(),
                photo.getBookPhoto().getImageUrl(),
                photo.getDisplayOrder()
        );
    }
}
