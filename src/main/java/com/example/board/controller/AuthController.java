package com.example.board.controller;

import com.example.board.dto.TokenRequestDTO;
import com.example.board.dto.TokenResponseDTO;
import com.example.board.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/reissue")
    public ResponseEntity<TokenResponseDTO> reissue(@RequestBody TokenRequestDTO tokenRequest) {
        TokenResponseDTO response = authService.reissue(tokenRequest);
        return ResponseEntity.ok(response);
    }
}