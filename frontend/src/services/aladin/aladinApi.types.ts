/** 알라딘 Open API 원본 응답 타입 (이 폴더 밖으로 나가지 않음) */
export interface AladinRawItem {
  title: string;
  author: string;
  publisher: string;
  cover: string;
  isbn13: string;
}

export interface AladinSearchResponse {
  item: AladinRawItem[];
}
