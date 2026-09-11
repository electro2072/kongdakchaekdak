plugins {
    java
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.kongdakchaekdak"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")
    // Step 5-2: 비로그인 공개 공유 웹뷰(/public/share/{token})를 이 앱 안에서 서버 렌더링하기 위한
    // 서버사이드 템플릿 엔진 (별도 Next.js 서비스를 새로 만들지 않기로 한 설계 결정에 따름).
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0")
    implementation("io.jsonwebtoken:jjwt-api:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.5")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.5")
    // 애플 로그인 — identity token(RS256으로 서명된 JWT)을 애플의 공개키(JWKS)로 직접 검증하는 데
    // 사용. 카카오/구글/네이버처럼 access token으로 "내 정보" API를 부르거나(카카오/네이버) 간편
    // 검증 엔드포인트에 던지는 방식(구글)이 애플엔 없어서 별도 라이브러리가 필요하다
    // (claude/독서기록앱_백엔드_애플로그인_설계_v1.md 2번 참고). RemoteJWKSet이 JWKS 응답을
    // 자동 캐싱해서 애플이 키를 교체하지 않는 한 매 로그인마다 애플 서버를 호출하지 않는다.
    implementation("com.nimbusds:nimbus-jose-jwt:9.37.3")
    runtimeOnly("com.mysql:mysql-connector-j")
    runtimeOnly("com.h2database:h2")
    // S3Presigner(software.amazon.awssdk:s3 모듈 안에 포함) — presigned URL은 순수 로컬 서명 연산이라
    // 네트워크 요청을 보내지 않는다. (G16, 2026-09-11) 회원 탈퇴 시 사진 오브젝트 삭제용으로 같은 모듈의
    // S3Client를 추가로 쓴다(의존성 변경 없음, S3Config 참고).
    implementation(platform("software.amazon.awssdk:bom:2.47.4"))
    implementation("software.amazon.awssdk:s3")
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

// backend/.env (git에 커밋되지 않음, 루트 .gitignore의 ".env" 패턴에 걸림)에 소셜 로그인
// Client ID/Secret 같은 값을 KEY=VALUE 형태로 적어두면, gradle bootRun 실행 시 이 파일을 읽어
// 프로세스 환경변수로 넘겨준다. application.yml의 ${KAKAO_CLIENT_ID:} 같은 플레이스홀더가
// 이 환경변수를 그대로 읽는다. .env.example 파일에 필요한 키 목록이 있다.
tasks.named<JavaExec>("bootRun") {
    doFirst {
        val envFile = file(".env")
        if (envFile.exists()) {
            envFile.readLines().forEach { rawLine ->
                val line = rawLine.trim()
                if (line.isNotEmpty() && !line.startsWith("#")) {
                    val separatorIndex = line.indexOf('=')
                    if (separatorIndex > 0) {
                        val key = line.substring(0, separatorIndex).trim()
                        var value = line.substring(separatorIndex + 1).trim()
                        // 일부 에디터가 값을 따옴표로 감싸는 경우 벗겨낸다.
                        if (value.length >= 2 &&
                            ((value.startsWith("\"") && value.endsWith("\"")) ||
                                    (value.startsWith("'") && value.endsWith("'")))
                        ) {
                            value = value.substring(1, value.length - 1)
                        }
                        environment(key, value)
                    }
                }
            }
        } else {
            logger.lifecycle(
                "[.env] backend/.env 파일이 없어 소셜 로그인 환경변수 없이 실행합니다 " +
                        "(카카오/구글/네이버 로그인은 동작하지 않음 — .env.example 참고)."
            )
        }
    }
}
