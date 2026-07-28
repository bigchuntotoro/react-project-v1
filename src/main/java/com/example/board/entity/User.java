package com.example.board.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String socialId; // 네이버 고유 식별 ID

    @Column(length = 100)
    private String email;

    @Column(length = 50)
    private String name;

    @Column(length = 20)
    private String provider; // NAVER

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private LocalDateTime createdAt;

    @Builder
    public User(String socialId, String email, String name, String provider, Role role) {
        this.socialId = socialId;
        this.email = email;
        this.name = name;
        this.provider = provider;
        this.role = role;
        this.createdAt = LocalDateTime.now();
    }

    // 네이버 프로필 정보 수정 시 업데이트
    public User update(String name, String email) {
        this.name = name;
        this.email = email;
        return this;
    }

    public String getRoleKey() {
        return this.role.getKey();
    }
}