package com.bookflex.domain.share;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Step 5-2: 비로그인 사용자도 볼 수 있는 공개 공유 웹페이지. scope(all/group/custom)와
 * 무관하게 public_token만 알면 누구나 접근 가능하다(기획서 7-4에서 이미 확정된 정책) —
 * 그래서 여기엔 별도의 열람 권한 검사가 없다. SecurityConfig의 PUBLIC_PATHS에 /public/**이
 * 등록되어 있어 인증 없이 접근할 수 있다. REST API가 아니라 서버 렌더링 HTML 페이지라
 * @RestController가 아닌 @Controller를 사용한다.
 */
@Controller
@RequestMapping("/public/share")
@RequiredArgsConstructor
public class PublicShareController {

    private final PublicShareViewService publicShareViewService;

    @GetMapping("/{token}")
    public String view(@PathVariable String token, Model model, HttpServletResponse response) {
        return publicShareViewService.getView(token)
                .map(view -> {
                    model.addAttribute("view", view);
                    return view.shareType() == ShareType.BOOK ? "share/book" : "share/dashboard";
                })
                .orElseGet(() -> {
                    response.setStatus(HttpStatus.NOT_FOUND.value());
                    return "share/not-found";
                });
    }
}
