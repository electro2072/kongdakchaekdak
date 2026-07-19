package com.bookflex.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI bookflexOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("독서 기록 공유 앱 API")
                        .description("Reading Record App backend API 문서 (개발 진행 중)")
                        .version("v0.0.1"));
    }
}
