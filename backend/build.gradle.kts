plugins {
    java
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.bookflex"
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
    runtimeOnly("com.mysql:mysql-connector-j")
    runtimeOnly("com.h2database:h2")
    // S3Presigner(software.amazon.awssdk:s3 모듈 안에 포함)만 사용 — presigned URL은 순수
    // 로컬 서명 연산이라 실제로 AWS에 네트워크 요청을 보내지 않는다(S3Client는 별도로 안 만든다).
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
