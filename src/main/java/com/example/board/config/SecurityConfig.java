package com.example.board.config;

import com.example.board.config.jwt.JwtAuthenticationFilter;
import com.example.board.config.jwt.JwtTokenProvider;
import com.example.board.config.oauth.CustomOAuth2UserService;
import com.example.board.config.oauth.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final JwtTokenProvider jwtTokenProvider;


    /**
     * =========================================================
     * Spring Security Filter Chain
     * =========================================================
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http

                // -------------------------------------------------
                // CSRF
                // JWT 기반 Stateless API이므로 비활성화
                // -------------------------------------------------
                .csrf(AbstractHttpConfigurer::disable)


                // -------------------------------------------------
                // 기본 로그인 / Basic 인증 비활성화
                // -------------------------------------------------
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)


                // -------------------------------------------------
                // CORS
                // -------------------------------------------------
                .cors(cors ->
                        cors.configurationSource(corsConfigurationSource())
                )


                // -------------------------------------------------
                // Session
                // JWT 기반 인증이므로 세션 사용하지 않음
                // -------------------------------------------------
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )


                // -------------------------------------------------
                // URL 권한 설정
                // -------------------------------------------------
                .authorizeHttpRequests(auth -> auth

                        // -----------------------------------------
                        // CORS Preflight
                        // -----------------------------------------
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()


                        // -----------------------------------------
                        // OAuth2 로그인
                        // -----------------------------------------
                        .requestMatchers(
                                "/oauth2/**",
                                "/login/**"
                        ).permitAll()


                        // -----------------------------------------
                        // JWT 인증 관련 API
                        // -----------------------------------------
                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()


                        // -----------------------------------------
                        // 게시글 조회
                        // GET은 비로그인 허용
                        // -----------------------------------------
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/boards/**"
                        ).permitAll()


                        // -----------------------------------------
                        // 첨부파일 다운로드
                        // -----------------------------------------
                        .requestMatchers(
                                "/api/boards/download/**"
                        ).permitAll()


                        // -----------------------------------------
                        // 게시글 작성 / 수정 / 삭제
                        // JWT 인증 필요
                        // -----------------------------------------
                        .requestMatchers(
                                "/api/boards/**"
                        ).authenticated()


                        // -----------------------------------------
                        // 그 외 모든 요청
                        // -----------------------------------------
                        .anyRequest().authenticated()
                )


                // -------------------------------------------------
                // Naver OAuth2 Login
                // -------------------------------------------------
                .oauth2Login(oauth2 -> oauth2

                        .userInfoEndpoint(userInfo ->
                                userInfo.userService(
                                        customOAuth2UserService
                                )
                        )

                        .successHandler(
                                oAuth2SuccessHandler
                        )
                )


                // -------------------------------------------------
                // JWT Authentication Filter
                // -------------------------------------------------
                .addFilterBefore(
                        new JwtAuthenticationFilter(
                                jwtTokenProvider
                        ),
                        UsernamePasswordAuthenticationFilter.class
                );


        return http.build();
    }


    /**
     * =========================================================
     * CORS Configuration
     * =========================================================
     *
     * 개발 환경
     *   http://localhost:3000
     *
     * 운영 환경
     *   http://100.88.187.37:83
     *
     * Nginx
     *   :83
     *
     * Spring Boot
     *   :8083
     * =========================================================
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();


        // -------------------------------------------------
        // 허용 Origin
        // -------------------------------------------------
        config.setAllowedOrigins(
                List.of(
                        "http://localhost:3000",
                        "http://100.88.187.37:83"
                )
        );


        // -------------------------------------------------
        // 허용 HTTP Method
        // -------------------------------------------------
        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );


        // -------------------------------------------------
        // 허용 HTTP Header
        // Authorization: Bearer JWT
        // Content-Type: application/json
        // -------------------------------------------------
        config.setAllowedHeaders(
                List.of("*")
        );


        // -------------------------------------------------
        // Cookie / Authorization 인증 허용
        // -------------------------------------------------
        config.setAllowCredentials(true);


        // -------------------------------------------------
        // 브라우저에서 접근 가능한 Response Header
        // -------------------------------------------------
        config.setExposedHeaders(
                List.of(
                        "Authorization",
                        "Refresh-Token"
                )
        );


        // -------------------------------------------------
        // 모든 API에 CORS 적용
        // -------------------------------------------------
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                config
        );


        return source;
    }
}