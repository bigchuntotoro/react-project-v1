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
import java.util.List;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    // application.properties: app.allowed-frontend-urls=http://100.88.187.37:83,http://100.88.187.37:84,http://100.88.187.37:85
    @Value("#{'${app.allowed-frontend-urls}'.split(',')}")
    private List<String> allowedFrontendUrls;

    @Value("${app.default-frontend-url}")
    private String defaultFrontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        // 1. JWT 발급
        String token = jwtTokenProvider.createToken(authentication);

        // 2. 로그인 시작 시 저장한 frontend origin 확인 (예: http://100.88.187.37:84)
        String frontendUrl = getFrontendFromCookie(request);

        // 3. Frontend의 OAuth redirect 페이지로 이동
        String targetUrl = UriComponentsBuilder
                .fromUriString(frontendUrl + "/oauth/redirect")
                .queryParam("token", token)
                .build()
                .encode()
                .toUriString();

        // 4. frontend 쿠키 삭제
        clearFrontendCookie(response);

        // 5. Frontend로 redirect
        getRedirectStrategy().sendRedirect(
                request,
                response,
                targetUrl
        );
    }

    /**
     * OAuth2 로그인 시작 전에 저장한 frontend origin 쿠키 조회
     *
     * 값 예시: http://100.88.187.37:84
     * 화이트리스트(app.allowed-frontend-urls)에 없는 값이면 기본값 사용
     */
    private String getFrontendFromCookie(HttpServletRequest request) {

        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            return defaultFrontendUrl;
        }

        for (Cookie cookie : cookies) {

            if ("oauth2_frontend".equals(cookie.getName())) {

                String value = cookie.getValue();

                if (allowedFrontendUrls.contains(value)) {
                    return value;
                }
            }
        }

        return defaultFrontendUrl;
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