package de.timbang.backend.model;

public record JwtTokenPacket(
        String username,
        String token,
        String refreshToken
) {
}
