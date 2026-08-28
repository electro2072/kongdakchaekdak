package com.kongdakchaekdak.domain.dashboard;

import com.kongdakchaekdak.domain.book.Book;
import com.kongdakchaekdak.domain.book.BookRepository;
import com.kongdakchaekdak.domain.book.BookStatus;
import com.kongdakchaekdak.domain.common.Genre;
import com.kongdakchaekdak.domain.dashboard.dto.BookHighlightDto;
import com.kongdakchaekdak.domain.dashboard.dto.DashboardHighlights;
import com.kongdakchaekdak.domain.dashboard.dto.DashboardResponse;
import com.kongdakchaekdak.domain.dashboard.dto.GenreRatioDto;
import com.kongdakchaekdak.domain.dashboard.dto.MonthlyTrendDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 기획서 3-6-1 "독서 대시보드(Recap)" 통계 집계. 자체 테이블 없이 Book 데이터를 그때그때
 * 실시간 집계한다 (백엔드구축계획 문서의 판단 그대로 — 사용자·데이터가 늘어 성능 이슈가 생기면
 * 그때 캐싱/배치 집계 테이블 도입 검토). 항상 "본인" 통계만 다룬다 — 마이페이지 개인 기능이라
 * 다른 회원의 대시보드를 조회하는 API는 없음(컨트롤러에서 currentUserId만 사용).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    // 화면설계서 Frame 05.1 — 기간 종류(월간/분기별/연간)와 무관하게 "월별 완독 추이" 막대그래프는
    // 항상 고정된 개월 수만큼 보여준다. 선택한 기간이 연간이어도 그래프 자체는 6개월치로 고정.
    private static final int TREND_MONTHS = 6;
    private static final String OTHER_GENRE_LABEL = "기타";
    // 기획서 1장의 캐치프라이즈를 그대로 재사용. completedBookCount % 길이로 결정론적으로 골라서
    // (Math.random 등 비결정적 요소 없이) 테스트 가능하게 한다.
    private static final String[] CAPTION_TAILS = {
            "병렬독서도 독서다 🔥",
            "패션독서 하면 왜 안돼? 📚",
            "나도 지성인인 척 하고 싶어 ✨",
            "완독 못 해도 다 독서야 😌"
    };

    private final BookRepository bookRepository;

    public DashboardResponse getDashboard(Long currentUserId, DashboardPeriod period, YearMonth referenceMonth) {
        LocalDate periodStart = resolvePeriodStart(period, referenceMonth);
        LocalDate periodEnd = resolvePeriodEnd(period, referenceMonth);

        // 추이 그래프는 선택 기간의 "마지막 달"을 기준으로 직전 6개월 고정 — 이렇게 해야
        // 분기/연간을 선택해도 그래프가 항상 선택 기간을 포함하며 끝난다.
        YearMonth trendEndMonth = YearMonth.from(periodEnd);
        YearMonth trendStartMonth = trendEndMonth.minusMonths(TREND_MONTHS - 1);
        LocalDate trendStart = trendStartMonth.atDay(1);
        LocalDate trendEnd = trendEndMonth.atEndOfMonth();

        // 헤드라인 통계 구간과 추이 구간을 한 번의 쿼리로 커버하는 합집합 범위로 조회한 뒤,
        // 두 용도로 각각 메모리에서 필터링한다 (MVP 데이터 규모에서는 이 편이 더 간단하고 충분히 빠름).
        LocalDate queryStart = periodStart.isBefore(trendStart) ? periodStart : trendStart;
        LocalDate queryEnd = periodEnd.isAfter(trendEnd) ? periodEnd : trendEnd;

        List<Book> booksInRange = bookRepository.findByUserIdAndStatusAndEndDateBetween(
                currentUserId, BookStatus.DONE, queryStart, queryEnd);

        List<Book> booksInPeriod = booksInRange.stream()
                .filter(b -> !b.getEndDate().isBefore(periodStart) && !b.getEndDate().isAfter(periodEnd))
                .toList();

        long completedBookCount = booksInPeriod.size();
        long totalPagesRead = booksInPeriod.stream()
                .mapToLong(b -> b.getTotalPages() == null ? 0L : b.getTotalPages())
                .sum();

        List<GenreRatioDto> genreRatios = buildGenreRatios(booksInPeriod);
        List<MonthlyTrendDto> monthlyTrend = buildMonthlyTrend(booksInRange, trendStartMonth, trendEndMonth);
        DashboardHighlights highlights = buildHighlights(booksInPeriod, genreRatios);
        String recommendedCaption = buildCaption(period, completedBookCount);

        return new DashboardResponse(
                currentUserId,
                period,
                buildPeriodLabel(period, referenceMonth),
                periodStart,
                periodEnd,
                completedBookCount,
                totalPagesRead,
                genreRatios,
                monthlyTrend,
                highlights,
                recommendedCaption
        );
    }

    private LocalDate resolvePeriodStart(DashboardPeriod period, YearMonth referenceMonth) {
        return switch (period) {
            case MONTH -> referenceMonth.atDay(1);
            case QUARTER -> quarterStartMonth(referenceMonth).atDay(1);
            case YEAR -> LocalDate.of(referenceMonth.getYear(), 1, 1);
        };
    }

    private LocalDate resolvePeriodEnd(DashboardPeriod period, YearMonth referenceMonth) {
        return switch (period) {
            case MONTH -> referenceMonth.atEndOfMonth();
            case QUARTER -> quarterStartMonth(referenceMonth).plusMonths(2).atEndOfMonth();
            case YEAR -> LocalDate.of(referenceMonth.getYear(), 12, 31);
        };
    }

    private YearMonth quarterStartMonth(YearMonth referenceMonth) {
        int quarterIndex = (referenceMonth.getMonthValue() - 1) / 3; // 0-based: 0,1,2,3
        int startMonth = quarterIndex * 3 + 1;
        return YearMonth.of(referenceMonth.getYear(), startMonth);
    }

    private String buildPeriodLabel(DashboardPeriod period, YearMonth referenceMonth) {
        return switch (period) {
            case MONTH -> referenceMonth.getYear() + "년 " + referenceMonth.getMonthValue() + "월";
            case QUARTER -> {
                int quarterNumber = (referenceMonth.getMonthValue() - 1) / 3 + 1;
                yield referenceMonth.getYear() + "년 " + quarterNumber + "분기";
            }
            case YEAR -> referenceMonth.getYear() + "년";
        };
    }

    private List<GenreRatioDto> buildGenreRatios(List<Book> booksInPeriod) {
        if (booksInPeriod.isEmpty()) {
            return List.of();
        }
        Map<String, Long> countByGenre = booksInPeriod.stream()
                .collect(Collectors.groupingBy(this::genreLabel, Collectors.counting()));
        long total = booksInPeriod.size();

        return countByGenre.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed()
                        .thenComparing(Map.Entry.comparingByKey()))
                .map(e -> new GenreRatioDto(e.getKey(), e.getValue(), roundToOneDecimal(e.getValue() * 100.0 / total)))
                .toList();
    }

    // 2026-08-27: Book.genre가 자유 String에서 Genre enum으로 바뀌면서 null 체크만 남았다
    // (enum 참조는 공백일 수 없으므로 isBlank() 체크는 더 이상 불필요). 테이블정의서상 genre는
    // 선택 입력이라 미입력 책이 있을 수 있음 — "기타"로 묶는다.
    private String genreLabel(Book book) {
        Genre genre = book.getGenre();
        return genre == null ? OTHER_GENRE_LABEL : genre.getLabel();
    }

    private double roundToOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private List<MonthlyTrendDto> buildMonthlyTrend(List<Book> booksInRange, YearMonth trendStartMonth, YearMonth trendEndMonth) {
        Map<YearMonth, Long> countByMonth = booksInRange.stream()
                .map(b -> YearMonth.from(b.getEndDate()))
                .filter(ym -> !ym.isBefore(trendStartMonth) && !ym.isAfter(trendEndMonth))
                .collect(Collectors.groupingBy(ym -> ym, Collectors.counting()));

        List<MonthlyTrendDto> trend = new ArrayList<>();
        YearMonth cursor = trendStartMonth;
        while (!cursor.isAfter(trendEndMonth)) {
            // YearMonth#toString()은 "yyyy-MM" 형식(예: "2026-07")을 그대로 반환한다.
            trend.add(new MonthlyTrendDto(cursor.toString(), countByMonth.getOrDefault(cursor, 0L)));
            cursor = cursor.plusMonths(1);
        }
        return trend;
    }

    private DashboardHighlights buildHighlights(List<Book> booksInPeriod, List<GenreRatioDto> genreRatios) {
        if (booksInPeriod.isEmpty()) {
            return new DashboardHighlights(null, null, null);
        }

        String topGenre = genreRatios.isEmpty() ? null : genreRatios.get(0).genre();

        // 완독 기간(일수)이 같은 책이 여럿이면 id가 더 작은(먼저 등록된) 책을 우선한다 —
        // longest는 max()라 id 역순 비교로, fastest는 min()이라 id 정순 비교로 같은 효과를 낸다.
        Book longest = booksInPeriod.stream()
                .max(Comparator.comparingLong(this::readingDays)
                        .thenComparing(Book::getId, Comparator.reverseOrder()))
                .orElseThrow();
        Book fastest = booksInPeriod.stream()
                .min(Comparator.comparingLong(this::readingDays)
                        .thenComparing(Book::getId))
                .orElseThrow();

        return new DashboardHighlights(
                topGenre,
                new BookHighlightDto(longest.getId(), longest.getTitle(), readingDays(longest)),
                new BookHighlightDto(fastest.getId(), fastest.getTitle(), readingDays(fastest))
        );
    }

    // 화면설계서 서재 탭의 "9일" 표기와 동일하게 시작일~종료일을 양 끝 포함해서 센다
    // (예: 06.20~06.28 = 9일, 28-20+1).
    private long readingDays(Book book) {
        return ChronoUnit.DAYS.between(book.getStartDate(), book.getEndDate()) + 1;
    }

    private String buildCaption(DashboardPeriod period, long completedBookCount) {
        if (completedBookCount == 0) {
            return "아직 이 기간에 완독한 책이 없어요 — 다음 리캡을 기대해주세요!";
        }
        String relativePeriod = switch (period) {
            case MONTH -> "이번 달";
            case QUARTER -> "이번 분기";
            case YEAR -> "올해";
        };
        String tail = CAPTION_TAILS[(int) (completedBookCount % CAPTION_TAILS.length)];
        return relativePeriod + " " + completedBookCount + "권 완독! " + tail;
    }
}
