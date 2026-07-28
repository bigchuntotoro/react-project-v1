package com.example.board.config.oauth;

import com.example.board.config.jwt.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    // 🔑 프로젝트에서 작성하신 JWT 토큰 발급 클래스를 주입받습니다.
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        // 1. 로그인 성공한 사용자 기반으로 JWT (Access Token) 생성
        String token = jwtTokenProvider.createToken(authentication);

        // 2. React 콜백 URL 주소 뒤에 ?token={JWT_TOKEN} 쿼리 파라미터 첨부
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/oauth/redirect")
                .queryParam("token", token) // 👈 주석을 해제하고 토큰 추가!
                .build()
                .encode()
                .toUriString();

        // 3. React 프론트엔드로 리다이렉트
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}