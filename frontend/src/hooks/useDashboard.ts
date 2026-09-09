import {useCallback, useEffect, useState} from 'react';
import type {DashboardPeriod, DashboardResponse} from '../types/api/dashboard';
import {apiFetch} from '../services/apiClient';

interface UseDashboardResult {
  period: DashboardPeriod;
  setPeriod: (period: DashboardPeriod) => void;
  data: DashboardResponse | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

/** "yyyy-MM" — GET /api/dashboard의 date 쿼리 파라미터(현재 달 기준, 백엔드가 이 달이 속한 기간을 계산) */
function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// 2026-09-08 업데이트: GET /api/dashboard 실제 연동(claude/독서기록앱_프론트_전체API연동_설계_v1.md
// 5장) — 백엔드 계약이 이미 확정·실측 검증까지 끝나 있어서(claude/독서기록앱_프론트요청_대시보드API필드확인_v1.md
// 답변) 이 함수 내부만 교체하면 됐고, useDashboard를 쓰는 화면 코드는 그대로다.
function fetchDashboard(period: DashboardPeriod): Promise<DashboardResponse> {
  const query = `period=${period.toUpperCase()}&date=${currentYearMonth()}`;
  return apiFetch<DashboardResponse>(`/api/dashboard?${query}`);
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
