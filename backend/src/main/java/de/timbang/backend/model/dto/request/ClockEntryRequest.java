package de.timbang.backend.model.dto.request;

import java.time.LocalDateTime;

public record ClockEntryRequest(
    String notes,
    LocalDateTime timestamp
) {} 