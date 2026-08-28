package com.example.board.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username; // 또는 userId / email

    @Column(nullable = false)
    private String tokenValue;

    @Builder
    public RefreshToken(String username, String tokenValue) {
        this.username = username;
        this.tokenValue = tokenValue;
    }

    public void updateValue(String tokenValue) {
        this.tokenValue = tokenValue;
    }
}