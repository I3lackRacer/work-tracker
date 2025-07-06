package de.timbang.backend.model.dto.request;

import java.time.LocalDateTime;

public record EditWorkEntryRequest(
    LocalDateTime newStartTime,
    LocalDateTime newEndTime,
    String notes
) {} 