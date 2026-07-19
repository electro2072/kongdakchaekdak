import { Book } from "./book";

/**
 * 모든 도서 검색 API가 구현해야 하는 공통 인터페이스.
 * 새 도서 API를 추가하려면 이 인터페이스를 구현하는 클래스 하나만 만들고
 * bookService.ts 에 등록하면 된다 (화면/훅 코드는 수정 불필요).
 */
export interface BookSearchProvider {
  readonly providerId: string;
  search(query: string): Promise<Book[]>;
}
