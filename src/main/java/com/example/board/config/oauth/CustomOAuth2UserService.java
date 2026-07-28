package com.example.board.config.oauth;

import com.example.board.config.oauth.dto.OAuthAttributes;
import com.example.board.entity.User;
import com.example.board.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        // 1. 서비스 구분 (naver 등)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 2. OAuth2 로그인 진행 시 키가 되는 필드값 (네이버의 경우 'response')
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        // 3. OAuth2UserService를 통해 가져온 OAuth2User의 attribute 담기
        OAuthAttributes attributes = OAuthAttributes.of(registrationId, userNameAttributeName, oAuth2User.getAttributes());

        // 4. MariaDB 유저 정보 조회 및 저장/수정
        User user = saveOrUpdate(attributes);

        // 5. DefaultOAuth2User 객체 반환
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(user.getRoleKey())),
                attributes.getAttributes(),
                attributes.getNameAttributeKey()
        );
    }

    // 소셜 사용자 정보 저장 또는 업데이트
    private User saveOrUpdate(OAuthAttributes attributes) {
        User user = userRepository.findBySocialId(attributes.getSocialId())
                .map(entity -> entity.update(attributes.getName(), attributes.getEmail()))
                .orElseGet(attributes::toEntity);

        return userRepository.save(user);
    }
}