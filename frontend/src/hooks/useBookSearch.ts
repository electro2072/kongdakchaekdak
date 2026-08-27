import { useCallback, useState } from "react";
import { Book } from "../types/book";
import { BookProviderId } from "../types/bookProviderId";
import { bookService } from "../services/bookService";

interface UseBookSearchResult {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  /** 마지막으로 실행한 검색어. 에러 화면의 "다시 시도" 버튼이 같은 검색을 재실행할 때 쓴다. */
  lastQuery: string;
  search: (query: string, providerId?: BookProviderId) => Promise<void>;
}

/** 도서 검색 상태(books/isLoading/error)를 관리하고 화면에 연결하는 훅 */
export function useBookSearch(): UseBookSearchResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  const search = useCallback(async (query: string, providerId?: BookProviderId) => {
    setLastQuery(query);
    if (!query.trim()) {
      setBooks([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await bookService.search(query, providerId);
      setBooks(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "도서 검색 중 오류가 발생했습니다.");
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { books, isLoading, error, lastQuery, search };
}
