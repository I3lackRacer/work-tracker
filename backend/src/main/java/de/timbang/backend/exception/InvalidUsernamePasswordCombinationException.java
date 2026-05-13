package de.timbang.backend.exception;

public class InvalidUsernamePasswordCombinationException extends Exception {

    public InvalidUsernamePasswordCombinationException() {
        super("Invalid username or password");
    }
}
