package de.timbang.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import de.timbang.backend.model.User;
import de.timbang.backend.model.WorkConfig;
import de.timbang.backend.model.WorkEntry;
import de.timbang.backend.model.WorkEntry.EntryType;
import de.timbang.backend.model.dto.request.ClockEntryRequest;
import de.timbang.backend.model.dto.request.WorkConfigRequest;
import de.timbang.backend.model.dto.response.WorkConfigResponse;
import de.timbang.backend.model.dto.response.WorkEntryResponse;
import de.timbang.backend.repository.UserRepository;
import de.timbang.backend.repository.WorkConfigRepository;
import de.timbang.backend.repository.WorkEntryRepository;

@Service
public class WorkService {

    @Autowired
    private WorkEntryRepository workEntryRepository;

    @Autowired
    private WorkConfigRepository workConfigRepository;

    @Autowired
    private UserRepository userRepository;

    public WorkEntryResponse clockIn(String username, ClockEntryRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime timestamp = request.timestamp() != null ? request.timestamp() : LocalDateTime.now();

        // Check if the last entry was a clock-in without a clock-out
        List<WorkEntry> recentEntries = workEntryRepository.findByUserOrderByIdDesc(user);
        if (!recentEntries.isEmpty()) {
            WorkEntry lastEntry = recentEntries.get(0);
            if (lastEntry.getType() == EntryType.CLOCK_IN) {
                throw new RuntimeException("You already have an open work session. Please clock out first.");
            }
            // For manual entries, check if the timestamp is after the last entry
            if (request.timestamp() != null && lastEntry.getTimestamp().isAfter(timestamp)) {
                throw new RuntimeException("New clock-in time must be after the last entry (" + 
                    lastEntry.getTimestamp().toString() + ")");
            }
        }

        WorkEntry entry = new WorkEntry();
        entry.setUser(user);
        entry.setTimestamp(timestamp);
        entry.setType(EntryType.CLOCK_IN);
        entry.setNotes(request.notes());

        return WorkEntryResponse.fromEntity(workEntryRepository.save(entry));
    }

    public WorkEntryResponse clockOut(String username, ClockEntryRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime timestamp = request.timestamp() != null ? request.timestamp() : LocalDateTime.now();

        System.out.println("Clocking time: " + timestamp);
        // Check if the last entry was a clock-out or if there are no entries
        List<WorkEntry> recentEntries = workEntryRepository.findByUserOrderByIdDesc(user);
        if (recentEntries.isEmpty()) {
            throw new RuntimeException("No work entries found. Please clock in first.");
        }

        WorkEntry lastEntry = recentEntries.get(0);
        System.out.println("Last entry: " + lastEntry.getTimestamp() + " " + lastEntry.getType() + " " + lastEntry.getNotes() + " " + lastEntry.getId());
        if (lastEntry.getType() == EntryType.CLOCK_OUT) {
            throw new RuntimeException("No open work session found. Please clock in first.");
        }

        // For both manual and automatic entries, ensure clock-out is after clock-in
        if (lastEntry.getTimestamp().isAfter(timestamp)) {
            throw new RuntimeException("Clock-out time must be after clock-in time (" + 
                lastEntry.getTimestamp().toString() + ")");
        }

        WorkEntry entry = new WorkEntry();
        entry.setUser(user);
        entry.setTimestamp(timestamp);
        entry.setType(EntryType.CLOCK_OUT);
        entry.setNotes(request.notes());

        return WorkEntryResponse.fromEntity(workEntryRepository.save(entry));
    }

    public List<WorkEntryResponse> getEntries(String username, LocalDateTime start, LocalDateTime end) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkEntry> entries;
        if (start != null && end != null) {
            entries = workEntryRepository.findByUserAndTimestampBetweenOrderByTimestampDesc(user, start, end);
        } else {
            entries = workEntryRepository.findByUserOrderByIdDesc(user);
        }

        return entries.stream()
            .map(WorkEntryResponse::fromEntity)
            .collect(Collectors.toList());
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
                newConfig.setExpectedDailyHours(8);
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
        config.setExpectedDailyHours(request.expectedDailyHours());
        config.setTrackLunchBreak(request.trackLunchBreak());
        config.setDefaultLunchBreakMinutes(request.defaultLunchBreakMinutes());
        config.setWorkDays(request.workDays());

        return WorkConfigResponse.fromEntity(workConfigRepository.save(config));
    }
} 