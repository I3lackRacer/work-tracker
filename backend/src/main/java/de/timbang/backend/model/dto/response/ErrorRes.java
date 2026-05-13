package de.timbang.backend.model.dto.response;

import lombok.Data;
import org.springframework.http.ResponseEntity;

@Data
public class ErrorRes {

    private String error;

    public static ErrorRes error(String errorMsg) {
        ErrorRes errorRes = new ErrorRes();
        errorRes.error = errorMsg;
        return errorRes;
    }

    public static ResponseEntity<?> errorRes(String error) {
        return ResponseEntity.badRequest().body(ErrorRes.error(error));
    }

    public static ResponseEntity<?> errorRes(Exception e) {
        return errorRes(e.getMessage());
    }
}
