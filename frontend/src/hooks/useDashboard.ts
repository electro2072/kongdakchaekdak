import {useCallback, useEffect, useState} from 'react';
import type {DashboardPeriod, DashboardResponse} from '../types/dashboard';
import {getMockDashboard} from '../mocks/dashboard';

interface UseDashboardResult {
  period: DashboardPeriod;
  setPeriod: (period: DashboardPeriod) => void;
  data: DashboardResponse | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

// TODO: GET /api/dashboard 연동 전이라 mock 데이터를 짧은 지연 후 반환한다(로딩 스켈레톤이 실제로
// 보이는지 확인하기 위한 용도도 겸함). 백엔드 계약은 확정돼 있으니(claude/독서기록앱_프론트요청_대시보드API필드확인_v1.md
// 답변 참고) 실제 연동 시 이 함수 내부만 `fetch('/api/dashboard?period=...&date=...')`로 교체하면
// useDashboard를 쓰는 화면 코드는 변경할 필요가 없다.
function fetchDashboard(period: DashboardPeriod): Promise<DashboardResponse> {
  return new Promise(resolve => {
    setTimeout(() => resolve(getMockDashboard(period)), 400);
  });
}

/** Frame 05.1 대시보드 화면의 기간 상태 + 데이터 로딩(로딩/에러/재시도)을 관리하는 훅 */
export function useDashboard(
  initialPeriod: DashboardPeriod = 'month',
): UseDashboardResult {
  const [period, setPeriod] = useState<DashboardPeriod>(initialPeriod);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchDashboard(period)
      .then(result => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : '대시보드를 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [period, reloadToken]);

  const retry = useCallback(() => setReloadToken(token => token + 1), []);

  return {period, setPeriod, data, isLoading, error, retry};
}
