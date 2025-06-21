package de.timbang.backend.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import de.timbang.backend.model.User;
import de.timbang.backend.model.dto.request.LoginRequest;
import de.timbang.backend.model.dto.request.RegisterRequest;
import de.timbang.backend.repository.UserRepository;
import de.timbang.backend.security.JwtService;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public String register(RegisterRequest request) {
        // Check if username already exists
        Optional<User> existingUser = userRepository.findByUsername(request.username());
        if (existingUser.isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));

        userRepository.save(user);

        return "User registered successfully";
    }

    public String login(LoginRequest credentials) {
        // Fetch the user by username
        Optional<User> user = userRepository.findByUsername(credentials.username());
        if (user.isEmpty()) {
            throw new RuntimeException("Invalid username or password");
        }

        if (!passwordEncoder.matches(credentials.password(), user.get().getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        return jwtService.generateToken(credentials.username());
    }

    public boolean validateToken(String token, String username) {
        return jwtService.isTokenValid(token, username);
    }

    public String extractUsernameFromToken(String token) {
        return jwtService.extractUsername(token);
    }

    public String refreshToken(String token) {
        // Validate the current token
        String username = jwtService.extractUsername(token);
        if (!jwtService.isTokenValid(token, username)) {
            throw new RuntimeException("Invalid token");
        }
        
        // Generate a new token with extended expiration
        return jwtService.refreshToken(token);
    }
}