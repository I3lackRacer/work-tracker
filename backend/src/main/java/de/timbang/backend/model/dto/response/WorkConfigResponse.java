package de.timbang.backend.model.dto.response;

import de.timbang.backend.model.State;
import de.timbang.backend.model.WorkConfig;

public record WorkConfigResponse(
        Long id,
        String username,
        Integer expectedWeeklyHours,
        Integer expectedMonthlyHours,
        Boolean trackLunchBreak,
        Integer defaultLunchBreakMinutes,
        String workDays,
        State state,
        Boolean showHolidays
) {
    public static WorkConfigResponse fromEntity(WorkConfig config) {
        return new WorkConfigResponse(
                config.getId(),
                config.getUser().getUsername(),
                config.getExpectedWeeklyHours(),
                config.getExpectedMonthlyHours(),
                config.getTrackLunchBreak(),
                config.getDefaultLunchBreakMinutes(),
                config.getWorkDays(),
                config.getState(),
                config.isShowHoliday()
        );
    }
} 