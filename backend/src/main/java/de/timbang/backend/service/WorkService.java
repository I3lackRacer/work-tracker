package de.timbang.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import de.timbang.backend.model.*;
import de.timbang.backend.model.dto.response.WorkSessionResponse;
import de.timbang.backend.repository.WorkSessionRepository;
import org.springframework.stereotype.Service;

import de.timbang.backend.model.WorkEntry.EntryType;
import de.timbang.backend.model.dto.request.ClockEntryRequest;
import de.timbang.backend.model.dto.request.EditWorkEntryRequest;
import de.timbang.backend.model.dto.request.ManualWorkEntryRequest;
import de.timbang.backend.model.dto.request.WorkConfigRequest;
import de.timbang.backend.model.dto.response.WorkConfigResponse;
import de.timbang.backend.model.dto.response.WorkEntryResponse;
import de.timbang.backend.repository.UserRepository;
import de.timbang.backend.repository.WorkConfigRepository;
import de.timbang.backend.repository.WorkEntryRepository;

@Service
public class WorkService {

    private final WorkEntryRepository workEntryRepository;

    private final WorkSessionRepository workSessionRepository;

    private final WorkConfigRepository workConfigRepository;

    private final UserRepository userRepository;

    private static final int PAGE_SIZE = 10;

    public WorkService(WorkEntryRepository workEntryRepository, WorkSessionRepository workSessionRepository, WorkConfigRepository workConfigRepository, UserRepository userRepository) {
        this.workEntryRepository = workEntryRepository;
        this.workSessionRepository = workSessionRepository;
        this.workConfigRepository = workConfigRepository;
        this.userRepository = userRepository;
    }

    public WorkSessionResponse clockIn(String username, ClockEntryRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime timestamp = request.timestamp() != null ? request.timestamp() : LocalDateTime.now();

        // Prevent future timestamps
        if (timestamp.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Cannot create entries with future timestamps");
        }

        WorkSession entry = new WorkSession();
        entry.setUser(user);
        entry.setStartTime(timestamp);
        entry.setNotes(request.notes());

        return WorkSessionResponse.fromEntity(workSessionRepository.save(entry));
    }

    public WorkSessionResponse clockOut(String username, Long clockInId, ClockEntryRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime timestamp = request.timestamp() != null ? request.timestamp() : LocalDateTime.now();

        // Prevent future timestamps
        if (timestamp.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Cannot create entries with future timestamps");
        }

        WorkSession workSession = workSessionRepository.findByIdAndUser(clockInId, user)
                .orElseThrow(() -> new RuntimeException("Clock-in entry not found"));

        if (workSession.getStartTime().isAfter(timestamp)) {
            throw new RuntimeException("Clock-out time must be after clock-in time (" +
                    workSession.getStartTime() + ")");
        }

        workSession.setEndTime(timestamp);

        return WorkSessionResponse.fromEntity(workSessionRepository.save(workSession));
    }

    public List<WorkSessionResponse> getEntries(String username, LocalDateTime start, LocalDateTime end) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkSession> entries;
        if (start != null && end != null) {
            entries = workSessionRepository.findByUserAndStartTimeBetweenOrderById(user, start, end);
        } else {
            entries = workSessionRepository.findByUserOrderById(user);
        }

        return entries.stream()
                .map(WorkSessionResponse::fromEntity)
                .toList();
    }

    public WorkConfigResponse getConfig(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkConfig config = workConfigRepository.findByUser(user)
                .orElseGet(() -> {
                    // Create default config if none exists
                    WorkConfig newConfig = new WorkConfig();
                    newConfig.setUser(user);
                    newConfig.setExpectedWeeklyHours(40);
                    newConfig.setExpectedMonthlyHours(160);
                    newConfig.setTrackLunchBreak(true);
                    newConfig.setDefaultLunchBreakMinutes(60);
                    newConfig.setWorkDays("1,2,3,4,5"); // Monday to Friday
                    return workConfigRepository.save(newConfig);
                });

        return WorkConfigResponse.fromEntity(config);
    }

    public WorkConfigResponse updateConfig(String username, WorkConfigRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkConfig config = workConfigRepository.findByUser(user)
                .orElseGet(() -> {
                    WorkConfig c = new WorkConfig();
                    c.setUser(user);
                    return c;
                });

        config.setExpectedWeeklyHours(request.expectedWeeklyHours());
        config.setExpectedMonthlyHours(request.expectedMonthlyHours());
        config.setTrackLunchBreak(request.trackLunchBreak());
        config.setDefaultLunchBreakMinutes(request.defaultLunchBreakMinutes());
        config.setWorkDays(request.workDays());
        config.setState(State.valueOf(request.state()));
        config.setShowHoliday(request.showHolidays());

        return WorkConfigResponse.fromEntity(workConfigRepository.save(config));
    }

    public void deleteWorkEntryPair(String username, Long clockInId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkSession workSession = workSessionRepository.findByIdAndUser(clockInId, user)
                .orElseThrow(() -> new RuntimeException("Work session not found"));

        workSessionRepository.delete(workSession);
    }

    public WorkSessionResponse editWorkEntry(String username, Long entryId, EditWorkEntryRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WorkSession entry = workSessionRepository.findByIdAndUser(entryId, user)
                .orElseThrow(() -> new RuntimeException("Work entry not found"));

        // Validate timestamp order
        if (entry.getEndTime() != null && entry.getStartTime().isAfter(entry.getEndTime())) {
            throw new RuntimeException("Start time must be before end time");
        }

        // Update the entry
        if (request.newStartTime() != null) {
            entry.setStartTime(request.newStartTime());
        }

        if (request.newEndTime() != null) {
            entry.setEndTime(request.newEndTime());
        }

        if (request.notes() != null) {
            entry.setNotes(request.notes());
        }

        return WorkSessionResponse.fromEntity(workSessionRepository.save(entry));
    }

    public List<WorkSessionResponse> getEntriesByPage(String username, int page) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkSession> entries = workSessionRepository.findByUserOrderByStartTimeDesc(user)
                .stream()
                .skip((long) page * PAGE_SIZE)
                .limit(PAGE_SIZE)
                .collect(Collectors.toList());

        return entries.stream()
                .map(WorkSessionResponse::fromEntity)
                .toList();
    }
}