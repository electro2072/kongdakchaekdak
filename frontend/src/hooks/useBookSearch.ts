import { useCallback, useState } from "react";
import { Book } from "../types/book";
import { BookProviderId } from "../types/bookProviderId";
import { bookService } from "../services/bookService";

interface UseBookSearchResult {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  search: (query: string, providerId?: BookProviderId) => Promise<void>;
}

/** 도서 검색 상태(books/isLoading/error)를 관리하고 화면에 연결하는 훅 */
export function useBookSearch(): UseBookSearchResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, providerId?: BookProviderId) => {
    if (!query.trim()) {
      setBooks([]);
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

  return { books, isLoading, error, search };
}
