package de.timbang.backend.model.dto.response;

import de.timbang.backend.model.Holiday;
import de.timbang.backend.model.State;

import java.time.LocalDate;

public record HolidayResponse(
        String date,
        String name,
        String description,
        State state
) {


    public static HolidayResponse fromHoliday(Holiday holiday) {
        return new HolidayResponse(
                holiday.getDate().toString(),
                holiday.getName(),
                holiday.getDescription(),
                holiday.getState()
        );
    }
}
