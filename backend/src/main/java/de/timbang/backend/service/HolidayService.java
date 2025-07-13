package de.timbang.backend.service;

import de.timbang.backend.model.Holiday;
import de.timbang.backend.model.HolidayEntry;
import de.timbang.backend.model.State;
import de.timbang.backend.repository.HolidayRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private final WebClient webClient;

    public HolidayService(HolidayRepository holidayRepository, WebClient webClient) {
        this.holidayRepository = holidayRepository;
        this.webClient = webClient;
    }

    // Runs at midnight on the 1st of every month
    @Scheduled(cron = "0 0 0 1 * *")
    public void scheduled() {
        fetchAndStoreHolidaysIfEmpty();
    }

    @PostConstruct
    public void init() {
        if (holidayRepository.count() == 0) {
            fetchAndStoreHolidaysIfEmpty();
        }
    }

    private void fetchAndStoreHolidaysIfEmpty() {
        webClient.get()
                .uri("https://feiertage-api.de/api/")
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Map<String, HolidayEntry>>>() {})
                .subscribe(response -> {
                    if (response.isEmpty()) {
                        return;
                    }
                    this.clearAll();

                    response.forEach((stateShortHandle, holidaysByState) -> {
                        holidaysByState.forEach((holidayName, holiday) -> {
                            LocalDate parsedDate = LocalDate.parse(holiday.getDatum());
                            Holiday newHoliday = Holiday.builder()
                                    .description(holiday.getHinweis())
                                    .name(holidayName)
                                    .date(parsedDate)
                                    .state(State.valueOf(stateShortHandle))
                                    .build();
                            save(newHoliday);
                        });
                    });
                });
    }

    private void save(Holiday holiday) {
        this.holidayRepository.save(holiday);
    }

    private void clearAll() {
        this.holidayRepository.deleteAll();
    }

    public List<Holiday> getHolidaysByState(State state) {
        return holidayRepository.findHolidayByState(state);
    }
}
