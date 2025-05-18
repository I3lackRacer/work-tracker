package de.timbang.backend.model.dto.response;

import java.time.LocalDateTime;

import de.timbang.backend.model.WorkEntry;
import de.timbang.backend.model.WorkEntry.EntryType;

public record WorkEntryResponse(
    Long id,
    String username,
    LocalDateTime timestamp,
    EntryType type,
    String notes
) {
    public static WorkEntryResponse fromEntity(WorkEntry entry) {
        return new WorkEntryResponse(
            entry.getId(),
            entry.getUser().getUsername(),
            entry.getTimestamp(),
            entry.getType(),
            entry.getNotes()
        );
    }
} 