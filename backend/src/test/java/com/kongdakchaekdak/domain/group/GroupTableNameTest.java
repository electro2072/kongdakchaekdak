package com.kongdakchaekdak.domain.group;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * (2026-09-11) {@code groups} 테이블명이 인용(quote)되어 나가는지 지키는 회귀 테스트.
 *
 * <p>{@code groups}는 MySQL 8.0.2부터 예약어라 따옴표 없이 나가면 운영 MySQL에서 문법 오류가 난다.
 * 그런데 테스트 DB(H2)는 따옴표 없는 {@code groups}도 받아 주기 때문에, 그룹 API 테스트만으로는
 * 누가 {@link Group}의 백틱을 지워도 알 수 없다.
 *
 * <p><b>확인 방법:</b> H2는 따옴표 없는 식별자를 대문자({@code GROUPS})로 저장하고, 따옴표로 감싼 식별자는
 * 적힌 그대로({@code groups}) 저장한다. 그래서 생성된 테이블 이름이 소문자 그대로면 Hibernate가 인용해서
 * DDL을 냈다는 뜻이다.
 */
@SpringBootTest
class GroupTableNameTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void groups_테이블은_따옴표로_인용되어_생성된다() {
        List<String> tableNames = jdbcTemplate.queryForList(
                "select table_name from information_schema.tables where upper(table_name) = 'GROUPS'",
                String.class);

        assertThat(tableNames)
                .as("MySQL 8 예약어 대응: Group 엔티티의 @Table(name = \"`groups`\") 백틱이 빠지면 GROUPS로 생성된다")
                .containsExactly("groups");
    }
}
