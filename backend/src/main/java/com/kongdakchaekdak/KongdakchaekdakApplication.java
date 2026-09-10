package com.kongdakchaekdak;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.time.ZoneId;
import java.util.TimeZone;

@SpringBootApplication
@EnableJpaAuditing
public class KongdakchaekdakApplication {

    // (OBS-26, 2026-09-10) 서비스 타임존은 KST(Asia/Seoul) 고정인데, 배포 환경(Railway 컨테이너)의
    // JVM 기본 타임존은 UTC로 뜬다. common.time.KstClock으로 날짜 기본값 계산 지점(Book.startDate/
    // endDate, 대시보드 "이번 달", lastLoginAt 등)은 KST로 고정했지만, 그건 "그 유틸을 실제로 쓴
    // 코드"에만 적용되는 방어선이다 — 누군가 또 LocalDate.now()/LocalDateTime.now()를 무심코 쓰면
    // 같은 버그가 재발한다. JVM 기본 타임존 자체를 KST로 맞춰 두 번째 방어선을 둔다 — 이러면
    // @CreatedDate/@LastModifiedDate(AuditingEntityListener의 기본 DateTimeProvider도 결국
    // 시스템 기본 타임존의 LocalDateTime.now()를 씀)처럼 KstClock을 거치지 않는 지점까지 함께
    // KST로 맞아떨어진다. 스프링 컨텍스트가 뜨기 전(빈 초기화 전)에 가장 먼저 실행돼야 하므로
    // static 블록으로 둔다 — main()의 SpringApplication.run() 호출보다 반드시 앞선다.
    static {
        TimeZone.setDefault(TimeZone.getTimeZone(ZoneId.of("Asia/Seoul")));
    }

    public static void main(String[] args) {
        SpringApplication.run(KongdakchaekdakApplication.class, args);
    }
}
