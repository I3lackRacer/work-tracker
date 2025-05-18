package de.timbang.backend.model.dto.request;

public record LoginRequest(
    String username,
    String password
) {} 