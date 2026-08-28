package com.example.board.repository;

import com.example.board.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 네이버 소셜 고유 ID로 사용자 조회
    Optional<User> findBySocialId(String socialId);
}