package de.timbang.backend.controller;

import java.util.Map;

import de.timbang.backend.exception.InvalidPasswordException;
import de.timbang.backend.exception.InvalidUsernamePasswordCombinationException;
import de.timbang.backend.exception.UserAlreadyExistsException;
import de.timbang.backend.model.JwtTokenPacket;
import de.timbang.backend.model.User;
import de.timbang.backend.model.dto.request.RefreshTokenRequest;
import de.timbang.backend.model.dto.response.ErrorRes;
import de.timbang.backend.model.dto.response.ValidateTokenResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import de.timbang.backend.model.dto.request.LoginRequest;
import de.timbang.backend.model.dto.request.RegisterRequest;
import de.timbang.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User result = authService.register(request);
            return ResponseEntity.ok(result);
        } catch (InvalidPasswordException | RuntimeException | UserAlreadyExistsException e) {
            return ErrorRes.errorRes(e);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest credentials) {
        try {
            JwtTokenPacket jwtTokenPacketResponseEntity = authService.login(credentials);
            return ResponseEntity.ok(jwtTokenPacketResponseEntity);
        } catch (InvalidUsernamePasswordCombinationException | RuntimeException e) {
            return ErrorRes.errorRes(e);
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ErrorRes.errorRes("Invalid or expired token");
        }

        String token = authHeader.substring(7);
        String username = authService.extractUsernameFromToken(token);
        if (username == null || !authService.validateToken(token, username)) {
            return ErrorRes.errorRes("Invalid or expired token");
        }

        return ResponseEntity.ok(ValidateTokenResponse.ok(username));


    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        try {
            String refreshToken = request.refreshToken();
            if (refreshToken == null || !refreshToken.startsWith("Bearer ")) {
                return ErrorRes.errorRes("Refresh token required");
            }

            String token = refreshToken.substring(7);
            JwtTokenPacket jwtTokenPacket = authService.refreshToken(token);

            return ResponseEntity.ok(jwtTokenPacket);
        } catch (RuntimeException e) {
            return ErrorRes.errorRes(e);
        }
    }
}