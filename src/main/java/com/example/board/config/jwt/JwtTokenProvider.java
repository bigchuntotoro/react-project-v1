package com.example.board.config.jwt;

import com.example.board.dto.TokenResponseDTO;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration-time}")
    private long expirationTime; // Access Token 만료 시간 (ms)

    private long refreshTokenExpirationTime; // Refresh Token 만료 시간 (ms)
    private SecretKey key;

    @PostConstruct
    protected void init() {
        // 비밀키 초기화 (HMAC-SHA 키 생성)
        this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        // Refresh Token 만료 시간 = Access Token 만료 시간의 14배 (예: 1시간 기준 -> 약 14일)
        this.refreshTokenExpirationTime = expirationTime * 14;
    }

    /**
     * 🔑 [신규] Authentication 객체 기반 Access Token + Refresh Token 동시 발급
     */
    public TokenResponseDTO generateToken(Authentication authentication) {
        String username = extractUsername(authentication);

        // 권한 정보 가져오기 (예: ROLE_USER, ROLE_ADMIN)
        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        Date now = new Date();
        Date accessTokenValidity = new Date(now.getTime() + expirationTime);
        Date refreshTokenValidity = new Date(now.getTime() + refreshTokenExpirationTime);

        // 1. Access Token 생성
        String accessToken = Jwts.builder()
                .subject(username)
                .claim("auth", authorities)
                .issuedAt(now)
                .expiration(accessTokenValidity)
                .signWith(key)
                .compact();

        // 2. Refresh Token 생성 (보안을 위해 권한 정보 제외, 최소한의 정보만 바인딩)
        String refreshToken = Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(refreshTokenValidity)
                .signWith(key)
                .compact();

        // 3. DTO 빌드 후 반환
        return TokenResponseDTO.builder()
                .grantType("Bearer")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * 1. 기존 createToken 메서드 (OAuth2SuccessHandler 등 단일 Access Token만 필요한 곳에서 호환 유지)
     */
    public String createToken(Authentication authentication) {
        return generateToken(authentication).getAccessToken();
    }

    /**
     * 2. 토큰에서 Authentication 객체 추출 (Spring Security 인증 객체 생성)
     */
    public Authentication getAuthentication(String token) {
        Claims claims = parseClaims(token);

        Object authClaim = claims.get("auth");
        Collection<? extends GrantedAuthority> authorities;

        // Refresh Token처럼 auth 클레임이 없는 경우 대비
        if (authClaim != null && !authClaim.toString().trim().isEmpty()) {
            authorities = Arrays.stream(authClaim.toString().split(","))
                    .filter(auth -> !auth.trim().isEmpty())
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());
        } else {
            authorities = java.util.Collections.emptyList();
        }

        User principal = new User(claims.getSubject(), "", authorities);
        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }

    /**
     * 3. 토큰 유효성 검증
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("만료된 JWT 토큰입니다.");
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("유효하지 않은 JWT 토큰입니다.");
        }
        return false;
    }

    /**
     * 토큰 클레임(Claims) 추출
     */
    private Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    /**
     * Principal 타입별 Username(식별자/이메일) 추출 헬퍼 메서드
     */
    private String extractUsername(Authentication authentication) {
        if (authentication.getPrincipal() instanceof OAuth2User oAuth2User) {
            String email = oAuth2User.getAttribute("email");
            return (email != null) ? email : authentication.getName();
        }
        return authentication.getName();
    }
}