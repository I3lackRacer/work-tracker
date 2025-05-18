package de.timbang.backend.model.dto.request;

import de.timbang.backend.model.User;

public record RegisterDTO(String username, String password) {
    
    public User toUserEntity() {
        User user = new User();
        user.setUsername(username());
        user.setPassword(password());
        return user;
    }
} 