package com.example.board.config.oauth;

import com.example.board.config.jwt.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.react-url}")
    private String reactUrl;

    @Value("${app.vue-url}")
    private String vueUrl;

    @Value("${app.default-frontend:react}")
    private String defaultFrontend;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        // 1. JWT 발급
        String token = jwtTokenProvider.createToken(authentication);

        // 2. 로그인 시작 시 저장한 frontend 확인
        String frontend = getFrontendFromCookie(request);

        // 3. 허용된 frontend만 사용
        String frontendUrl;

        if ("vue".equalsIgnoreCase(frontend)) {
            frontendUrl = vueUrl;
        } else if ("react".equalsIgnoreCase(frontend)) {
            frontendUrl = reactUrl;
        } else {
            // 잘못된 값이면 기본값 사용
            frontendUrl = "vue".equalsIgnoreCase(defaultFrontend)
                    ? vueUrl
                    : reactUrl;
        }

        // 4. Frontend의 OAuth redirect 페이지로 이동
        String targetUrl = UriComponentsBuilder
                .fromUriString(frontendUrl + "/oauth/redirect")
                .queryParam("token", token)
                .build()
                .encode()
                .toUriString();

        // 5. frontend 쿠키 삭제
        clearFrontendCookie(response);

        // 6. Frontend로 redirect
        getRedirectStrategy().sendRedirect(
                request,
                response,
                targetUrl
        );
    }

    /**
     * OAuth2 로그인 시작 전에 저장한 frontend 쿠키 조회
     *
     * 값:
     * react
     * vue
     */
    private String getFrontendFromCookie(HttpServletRequest request) {

        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            return defaultFrontend;
        }

        for (Cookie cookie : cookies) {

            if ("oauth2_frontend".equals(cookie.getName())) {

                String value = cookie.getValue();

                if ("react".equalsIgnoreCase(value)
                        || "vue".equalsIgnoreCase(value)) {
                    return value;
                }
            }
        }

        return defaultFrontend;
    }

    /**
     * OAuth2 로그인 완료 후 frontend 쿠키 삭제
     */
    private void clearFrontendCookie(HttpServletResponse response) {

        Cookie cookie = new Cookie("oauth2_frontend", null);

        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setHttpOnly(false);

        response.addCookie(cookie);
    }
}