package com.bookflex.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    // Step 3(인증) 이후 User/Book API가 인증을 요구하게 되어, Swagger UI에서 우측 상단
    // "Authorize" 버튼으로 Bearer 토큰을 넣고 바로 테스트할 수 있도록 스킴을 등록한다.
    private static final String BEARER_AUTH_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI bookflexOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("독서 기록 공유 앱 API")
                        .description("Reading Record App backend API 문서 (개발 진행 중)")
                        .version("v0.0.1"))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH_SCHEME))
                .components(new Components().addSecuritySchemes(BEARER_AUTH_SCHEME,
                        new SecurityScheme()
                                .name(BEARER_AUTH_SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
