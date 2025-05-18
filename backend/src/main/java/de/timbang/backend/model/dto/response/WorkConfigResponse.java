package de.timbang.backend.model.dto.response;

import de.timbang.backend.model.WorkConfig;

public record WorkConfigResponse(
    Long id,
    String username,
    Integer expectedWeeklyHours,
    Integer expectedDailyHours,
    Boolean trackLunchBreak,
    Integer defaultLunchBreakMinutes,
    String workDays
) {
    public static WorkConfigResponse fromEntity(WorkConfig config) {
        return new WorkConfigResponse(
            config.getId(),
            config.getUser().getUsername(),
            config.getExpectedWeeklyHours(),
            config.getExpectedDailyHours(),
            config.getTrackLunchBreak(),
            config.getDefaultLunchBreakMinutes(),
            config.getWorkDays()
        );
    }
} 