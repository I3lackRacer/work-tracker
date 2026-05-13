package de.timbang.backend.service;

import java.util.Optional;

import de.timbang.backend.exception.InvalidPasswordException;
import de.timbang.backend.exception.InvalidUsernamePasswordCombinationException;
import de.timbang.backend.exception.UserAlreadyExistsException;
import de.timbang.backend.model.JwtTokenPacket;
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

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtService jwtService;

    public AuthService(JwtService jwtService, PasswordEncoder passwordEncoder, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    public User register(RegisterRequest request) throws UserAlreadyExistsException, InvalidPasswordException {
        if (!isValidPassword(request.password())) {
            throw new InvalidPasswordException();
        }

        Optional<User> existingUser = userRepository.findByUsername(request.username());
        if (existingUser.isPresent()) {
            throw new UserAlreadyExistsException(request.username());
        }

        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));

        userRepository.save(user);

        return user;
    }

    private static final int PASSWORD_MIN_LENGTH = 6;
    private static final String ALLOWED_SYMBOLS_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@# ";

    private boolean isValidPassword(String password) {
        if (password.length() < PASSWORD_MIN_LENGTH) {
            return false;
        }

        for (char c : password.toCharArray()) {
            if (!ALLOWED_SYMBOLS_PATTERN.contains(String.valueOf(c))) {
                return false;
            }
        }

        return true;
    }

    public JwtTokenPacket login(LoginRequest credentials) throws InvalidUsernamePasswordCombinationException {
        // Fetch the user by username
        Optional<User> user = userRepository.findByUsername(credentials.username());
        if (user.isEmpty()) {
            throw new InvalidUsernamePasswordCombinationException();
        }

        if (!passwordEncoder.matches(credentials.password(), user.get().getPassword())) {
            throw new InvalidUsernamePasswordCombinationException();
        }
        String refreshToken = jwtService.generateRefreshToken(user.get().getUsername());
        String token = jwtService.generateToken(credentials.username());
        return new JwtTokenPacket(credentials.username(), token, refreshToken);
    }

    public boolean validateToken(String token, String username) {
        return jwtService.isTokenValid(token, username);
    }

    public String extractUsernameFromToken(String token) {
        return jwtService.extractUsername(token);
    }

    public JwtTokenPacket refreshToken(String token) {
        // Validate the current token
        String username = jwtService.extractUsername(token);
        if (!jwtService.isTokenValid(token, username)) {
            throw new RuntimeException("Invalid token");
        }

        // Generate a new token
        String newToken = jwtService.generateToken(username);
        String refreshToken = jwtService.generateRefreshToken(username);
        return new JwtTokenPacket(username, newToken, refreshToken);
    }
}