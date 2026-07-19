import {afterEach, describe, expect, it, jest} from '@jest/globals';
import {bookService} from '../src/services/bookService';
import {AladinApi} from '../src/services/aladin/aladinApi';
import {KakaoApi} from '../src/services/kakao/kakaoApi';
import {BookProviderId} from '../src/types/bookProviderId';

describe('bookService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('providerId를 지정하지 않으면 기본 provider(알라딘)로 위임한다', async () => {
    const spy = jest.spyOn(AladinApi.prototype, 'search').mockResolvedValue([]);

    await bookService.search('토지');

    expect(spy).toHaveBeenCalledWith('토지');
  });

  it('providerId를 지정하면 해당 API로 위임한다', async () => {
    const spy = jest.spyOn(KakaoApi.prototype, 'search').mockResolvedValue([]);

    await bookService.search('토지', BookProviderId.KAKAO);

    expect(spy).toHaveBeenCalledWith('토지');
  });

  it('등록되지 않은 provider를 요청하면 에러를 던진다', async () => {
    await expect(
      bookService.search('토지', 'UNKNOWN' as BookProviderId),
    ).rejects.toThrow('등록되지 않은 도서 API');
  });
});
