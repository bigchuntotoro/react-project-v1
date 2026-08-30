
package com.example.board.config.oauth;

import com.example.board.config.jwt.JwtTokenProvider;
import jakarta.servlet.ServletException;
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

    // =========================================================
    // JWT Token Provider
    // =========================================================
    private final JwtTokenProvider jwtTokenProvider;

    // =========================================================
    // React Frontend URL
    //
    // application.properties:
    // app.frontend-url=http://100.88.187.37:83
    // =========================================================
    @Value("${app.frontend-url}")
    private String frontendUrl;


    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        // =====================================================
        // 1. 로그인 성공 사용자 기반 JWT 생성
        // =====================================================
        String token = jwtTokenProvider.createToken(authentication);


        // =====================================================
        // 2. React OAuth2 Redirect URL 생성
        //
        // 최종 URL:
        //
        // http://100.88.187.37:83/oauth/redirect?token=JWT
        // =====================================================
        String targetUrl = UriComponentsBuilder
                .fromUriString(frontendUrl + "/oauth/redirect")
                .queryParam("token", token)
                .build()
                .encode()
                .toUriString();


        // =====================================================
        // 3. React로 Redirect
        // =====================================================
        getRedirectStrategy().sendRedirect(
                request,
                response,
                targetUrl
        );
    }
}
