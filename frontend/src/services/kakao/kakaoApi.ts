import Config from "react-native-config";
import { Book } from "../../types/book";
import { BookProviderId } from "../../types/bookProviderId";
import { BookSearchProvider } from "../../types/bookProvider";
import { KakaoRawDocument, KakaoSearchResponse } from "./kakaoApi.types";
import { logger } from "../../utils/logger";

// .env 의 KAKAO_API_KEY 사용 (.env.example 참고, react-native-config로 로드)
const KAKAO_API_KEY = Config.KAKAO_API_KEY ?? "";
const KAKAO_BASE_URL = "https://dapi.kakao.com/v3/search/book";

export class KakaoApi implements BookSearchProvider {
  readonly providerId = BookProviderId.KAKAO;

  async search(query: string): Promise<Book[]> {
    if (!KAKAO_API_KEY) {
      throw new Error("카카오 API 키가 설정되지 않았습니다 (.env의 KAKAO_API_KEY 확인)");
    }

    const url = `${KAKAO_BASE_URL}?query=${encodeURIComponent(query)}&size=20`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `KakaoAK ${KAKAO_API_KEY}`,
        },
      });
      if (!response.ok) {
        throw new Error(`카카오 API 요청 실패: ${response.status}`);
      }

      const data: KakaoSearchResponse = await response.json();
      const books = (data.documents ?? []).map((raw) => this.toDomain(raw));
      logger.debug("kakaoApi", "도서 검색 성공", { query, count: books.length });
      return books;
    } catch (error) {
      logger.error("kakaoApi", "도서 검색 실패", { query, error });
      throw error;
    }
  }

  private toDomain(raw: KakaoRawDocument): Book {
    return {
      id: raw.isbn,
      title: raw.title,
      author: raw.authors.join(", "),
      publisher: raw.publisher,
      coverImageUrl: raw.thumbnail || null,
      providerId: BookProviderId.KAKAO,
    };
  }
}
