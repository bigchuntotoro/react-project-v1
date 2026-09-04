package com.example.board.config.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // ✨ CORS Preflight(OPTIONS) 요청은 토큰 검증 없이 통과
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestURI = request.getRequestURI();

        try {
            // 1. Request Header에서 토큰 추출
            String token = resolveToken(request);

            // 2. 토큰 유효성 검증 후 SecurityContext에 Authentication 저장
            if (StringUtils.hasText(token)) {
                if (jwtTokenProvider.validateToken(token)) {
                    Authentication authentication = jwtTokenProvider.getAuthentication(token);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.info("[JwtFilter] URI: {}, 사용자 인증 성공: {}, 권한: {}",
                            requestURI, authentication.getName(), authentication.getAuthorities());
                } else {
                    log.warn("[JwtFilter] URI: {}, 토큰 유효성 검증 실패", requestURI);
                }
            } else {
                log.debug("[JwtFilter] URI: {}, Authorization 헤더에 토큰이 없습니다.", requestURI);
            }
        } catch (Exception e) {
            log.error("[JwtFilter] 인증 처리 중 예외 발생 - URI: {}, Error: {}", requestURI, e.getMessage(), e);
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7).trim(); // 공백 제거 처리 추가
        }
        return null;
    }
}