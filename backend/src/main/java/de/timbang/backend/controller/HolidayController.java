package de.timbang.backend.controller;

import de.timbang.backend.model.Holiday;
import de.timbang.backend.model.State;
import de.timbang.backend.model.dto.response.HolidayResponse;
import de.timbang.backend.service.HolidayService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.function.EntityResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/api/v1/holiday")
public class HolidayController {

    private final HolidayService holidayService;

    public HolidayController(HolidayService holidayService) {
        this.holidayService = holidayService;
    }

    @GetMapping("/state/{stateString}")
    public ResponseEntity<?> getHolidaysByState(@PathVariable String stateString) {
        State state = State.valueOf(stateString.toUpperCase());
        if  (state == null) {
            ResponseEntity.notFound().build();
        }

        List<Holiday> holidaysByState = this.holidayService.getHolidaysByState(state);
        List<HolidayResponse> holidayResponseList = holidaysByState
                .stream()
                .map(HolidayResponse::fromHoliday)
                .toList();
        return ResponseEntity.ok(holidayResponseList);
    }
}
