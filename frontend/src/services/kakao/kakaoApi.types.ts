/** 카카오 도서 검색 API 원본 응답 타입 (이 폴더 밖으로 나가지 않음) */
export interface KakaoRawDocument {
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  isbn: string;
}

export interface KakaoSearchResponse {
  documents: KakaoRawDocument[];
}
