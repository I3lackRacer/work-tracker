package de.timbang.backend.model.dto.request;

import java.time.LocalDateTime;

public record ManualWorkEntryRequest(
    LocalDateTime startTime,
    LocalDateTime endTime,
    String notes
) {} 