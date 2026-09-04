package com.example.board.config;

import com.example.board.config.jwt.JwtAuthenticationFilter;
import com.example.board.config.jwt.JwtTokenProvider;
import com.example.board.config.oauth.CustomOAuth2UserService;
import com.example.board.config.oauth.OAuth2SuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
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

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                // 1. CSRF, FormLogin, Basic 비활성화
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // 2. CORS 설정
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 3. 세션 Stateless 설정
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 4. 인증/인가 실패 예외 처리 (401 JSON 응답)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"인증이 필요합니다. 토큰을 확인해주세요.\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"권한이 없습니다.\"}");
                        })
                )

                // 5. URL 권한 설정 (단 하나만 작성)
                .authorizeHttpRequests(auth -> auth
                        // OPTIONS Preflight 요청 전체 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public endpoints
                        .requestMatchers("/public/**", "/oauth2/**", "/login/**", "/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/boards/**").permitAll()
                        .requestMatchers("/api/boards/download/**").permitAll()

                        // 관리자 전용 endpoint
                        .requestMatchers("/admin/**").hasRole("ADMIN")

                        // 게시글 작성/수정/삭제 등 (POST, PUT, DELETE 등)
                        .requestMatchers("/api/boards/**").authenticated()

                        // 그 외 모든 요청은 항상 맨 마지막에 위치
                        .anyRequest().authenticated()
                )

                // 6. OAuth2 Login 설정
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )

                // 7. JWT Filter 등록
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 프론트엔드 도메인 패턴 허용 (Localhost 및 외부 IP 포함)
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://100.88.187.37:83",
                "http://100.88.187.37:8083"
        ));

        // 허용 HTTP Method
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // 허용 HTTP Header 명시 및 Wildcard 허용
        config.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type", "*"));

        // Cookie / Authorization 인증 허용
        config.setAllowCredentials(true);

        // 브라우저에서 읽을 수 있는 Response Header 확장
        config.setExposedHeaders(List.of("Authorization", "Refresh-Token", "Content-Disposition"));

        // Preflight Caching 시간 설정 (1시간)
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}