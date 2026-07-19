import { Book } from "../types/book";
import { BookProviderId } from "../types/bookProviderId";
import { BookSearchProvider } from "../types/bookProvider";
import { AladinApi } from "./aladin/aladinApi";
import { KakaoApi } from "./kakao/kakaoApi";

/**
 * 여러 도서 API(provider)를 등록해두고, 요청 시 providerId 로 골라서 호출하는
 * 오케스트레이터. 화면/훅은 이 서비스만 알면 되고 개별 API 구현은 몰라도 된다.
 */
class BookService {
  private providers = new Map<BookProviderId, BookSearchProvider>();
  private defaultProviderId = BookProviderId.ALADIN;

  constructor() {
    this.register(new AladinApi());
    this.register(new KakaoApi());
  }

  register(provider: BookSearchProvider) {
    this.providers.set(provider.providerId as BookProviderId, provider);
  }

  async search(query: string, providerId?: BookProviderId): Promise<Book[]> {
    const provider = this.providers.get(providerId ?? this.defaultProviderId);
    if (!provider) {
      throw new Error(`등록되지 않은 도서 API: ${providerId}`);
    }
    return provider.search(query);
  }
}

export const bookService = new BookService();
