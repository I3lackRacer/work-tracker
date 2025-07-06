package de.timbang.backend.model.dto.response;

import de.timbang.backend.model.WorkSession;

import java.time.LocalDateTime;

public record WorkSessionResponse(
    Long id,
    String username,
    LocalDateTime startTime,
    LocalDateTime endTime,
    String notes
) {
    public static WorkSessionResponse fromEntity(WorkSession entry) {
        return new WorkSessionResponse(
            entry.getId(),
            entry.getUser().getUsername(),
            entry.getStartTime(),
            entry.getEndTime(),
            entry.getNotes()
        );
    }
} 