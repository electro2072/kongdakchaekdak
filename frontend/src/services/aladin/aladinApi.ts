import { Book } from "../../types/book";
import { BookProviderId } from "../../types/bookProviderId";
import { BookSearchProvider } from "../../types/bookProvider";
import { AladinSearchResponse } from "./aladinApi.types";

// TODO: .env 로 이동 (Step: 알라딘 API 키 발급 및 환경변수 설정)
const ALADIN_API_KEY = "";
const ALADIN_BASE_URL = "http://www.aladin.co.kr/ttb/api/ItemSearch.aspx";

export class AladinApi implements BookSearchProvider {
  readonly providerId = BookProviderId.ALADIN;

  async search(query: string): Promise<Book[]> {
    const url = `${ALADIN_BASE_URL}?ttbkey=${ALADIN_API_KEY}&Query=${encodeURIComponent(
      query
    )}&QueryType=Title&MaxResults=20&start=1&SearchTarget=Book&output=js&Version=20131101`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`알라딘 API 요청 실패: ${response.status}`);
    }

    const data: AladinSearchResponse = await response.json();
    return (data.item ?? []).map((raw) => this.toDomain(raw));
  }

  private toDomain(raw: AladinSearchResponse["item"][number]): Book {
    return {
      id: raw.isbn13,
      title: raw.title,
      author: raw.author,
      publisher: raw.publisher,
      coverImageUrl: raw.cover || null,
      providerId: BookProviderId.ALADIN,
    };
  }
}
