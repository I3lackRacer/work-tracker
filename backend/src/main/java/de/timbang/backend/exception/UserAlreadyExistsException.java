package de.timbang.backend.exception;

public class UserAlreadyExistsException extends Exception {

    private final String username;

    public UserAlreadyExistsException(String username){
        super("User is already exists: " + username);
        this.username = username;
    }

    public String getUsername() {
        return username;
    }
}
