package de.timbang.backend.model.dto.request;

public record WorkConfigRequest(
    Integer expectedWeeklyHours,
    Integer expectedDailyHours,
    Boolean trackLunchBreak,
    Integer defaultLunchBreakMinutes,
    String workDays
) {} 