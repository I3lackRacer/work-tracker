package de.timbang.backend.exception;

public class InvalidPasswordException extends Exception{

    public InvalidPasswordException() {
        super("Invalid Password.");
    }
}
