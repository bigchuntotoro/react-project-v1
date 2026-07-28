package com.example.board.service;

import com.example.board.config.jwt.JwtTokenProvider;
import com.example.board.dto.TokenRequestDTO;
import com.example.board.dto.TokenResponseDTO;
import com.example.board.entity.RefreshToken;
import com.example.board.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public TokenResponseDTO reissue(TokenRequestDTO tokenRequest) {
        String requestRefreshToken = tokenRequest.getRefreshToken();

        // 1. Refresh Token 검증 (만료 및 서기 유효성)
        if (!jwtTokenProvider.validateToken(requestRefreshToken)) {
            throw new RuntimeException("유효하지 않거나 만료된 Refresh Token입니다.");
        }

        // 2. Refresh Token에서 사용자 정보(Username/Email) 추출
        Authentication authentication = jwtTokenProvider.getAuthentication(requestRefreshToken);

        // 3. DB/Redis에 저장된 Refresh Token 가져오기
        RefreshToken refreshToken = refreshTokenRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("로그아웃된 사용자입니다."));

        // 4. 클라이언트가 보낸 토큰과 DB에 저장된 토큰이 일치하는지 검증
        if (!refreshToken.getTokenValue().equals(requestRefreshToken)) {
            throw new RuntimeException("토큰의 유저 정보가 일치하지 않습니다.");
        }

        // 5. 새로운 AccessToken & RefreshToken 생성 (RTR 방식)
        TokenResponseDTO newTokens = jwtTokenProvider.generateToken(authentication);

        // 6. DB의 Refresh Token 정보 업데이트
        refreshToken.updateValue(newTokens.getRefreshToken());

        return newTokens;
    }
}