package com.bookflex.domain.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void 닉네임_없이_생성하면_랜덤_닉네임이_부여된다() throws Exception {
        String body = objectMapper.writeValueAsString(new java.util.HashMap<>());

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nickname").value(matchesPattern("^(책벌레|독서가|이야기꾼|페이지터너)\\d{4}$")))
                .andExpect(jsonPath("$.gender").value("NONE"));
    }

    @Test
    void 회원_생성_후_단건_조회_수정_삭제가_동작한다() throws Exception {
        String createBody = """
                {"nickname": "테스터", "bio": "안녕하세요"}
                """;

        String response = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nickname").value("테스터"))
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/users/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("안녕하세요"));

        String updateBody = """
                {"bio": "수정된 소개"}
                """;
        mockMvc.perform(patch("/api/users/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("수정된 소개"))
                .andExpect(jsonPath("$.nickname").value("테스터"));

        mockMvc.perform(delete("/api/users/{id}", id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/users/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void 존재하지_않는_회원_조회시_404() throws Exception {
        mockMvc.perform(get("/api/users/{id}", 999_999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void 소개글이_너무_길면_400과_필드에러를_반환한다() throws Exception {
        String tooLongBio = "가".repeat(101);
        String body = objectMapper.writeValueAsString(java.util.Map.of("bio", tooLongBio));

        mockMvc.perform(post("/api/users").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("bio"));
    }
}
