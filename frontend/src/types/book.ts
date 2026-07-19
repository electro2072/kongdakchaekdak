import { BookProviderId } from "./bookProviderId";

/**
 * 앱 전체가 공유하는 도서 도메인 타입.
 * 알라딘/카카오 등 외부 API의 원본 응답 형태는 이 타입으로 변환된 뒤에만
 * 화면/훅/컴포넌트로 전달된다.
 */
export interface Book {
  /** 제공자 내부 식별자 (ISBN 등) */
  id: string;
  title: string;
  author: string;
  publisher: string;
  coverImageUrl: string | null;
  /** 이 결과를 반환한 API */
  providerId: BookProviderId;
}
