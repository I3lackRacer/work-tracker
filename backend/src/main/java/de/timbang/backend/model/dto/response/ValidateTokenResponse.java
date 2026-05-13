package de.timbang.backend.model.dto.response;

import lombok.Data;

@Data
public class ValidateTokenResponse {

    private boolean valid;
    private String username;
    private String error;

    public ValidateTokenResponse(boolean valid, String username, String error) {
        this.valid = valid;
        this.username = username;
        this.error = error;
    }

    public static ValidateTokenResponse ok(String username) {
        return new ValidateTokenResponse(true, username, "");
    }

    public static ValidateTokenResponse error(String errorMsg) {
        return new ValidateTokenResponse(false, "", errorMsg);
    }
}
