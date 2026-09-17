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
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("#{'${app.allowed-frontend-urls}'.split(',')}")
    private List<String> allowedFrontendUrls;

    @Value("${app.default-frontend-url}")
    private String defaultFrontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        String token = jwtTokenProvider.createToken(authentication);
        String frontendUrl = getFrontendFromCookie(request);

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth/redirect")
                .queryParam("token", token).build().encode().toUriString();

        clearFrontendCookie(response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String getFrontendFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return defaultFrontendUrl;

        return Arrays.stream(request.getCookies())
                .filter(c -> "oauth2_frontend".equals(c.getName()))
                .map(Cookie::getValue)
                .filter(allowedFrontendUrls::contains)
                .findFirst()
                .orElse(defaultFrontendUrl);
    }

    private void clearFrontendCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("oauth2_frontend", null);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setHttpOnly(false);
        response.addCookie(cookie);
    }
}