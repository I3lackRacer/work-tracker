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

    @Autowired
    private WorkEntryRepository workEntryRepository;

    @Autowired
    private WorkConfigRepository workConfigRepository;

    @Autowired
    private UserRepository userRepository;
    
    private static final int PAGE_SIZE = 10;

    public WorkEntryResponse clockIn(String username, ClockEntryRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime timestamp = request.timestamp() != null ? request.timestamp() : LocalDateTime.now();
        
        // Prevent future timestamps
        if (timestamp.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Cannot create entries with future timestamps");
        }

        // Check if the last entry was a clock-in without a clock-out
        List<WorkEntry> recentEntries = workEntryRepository.findByUserOrderByTimestampDesc(user);
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
        
        // Prevent future timestamps
        if (timestamp.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Cannot create entries with future timestamps");
        }

        // Check if the last entry was a clock-out or if there are no entries
        List<WorkEntry> recentEntries = workEntryRepository.findByUserOrderByTimestampDesc(user);
        if (recentEntries.isEmpty()) {
            throw new RuntimeException("No work entries found. Please clock in first.");
        }

        WorkEntry lastEntry = recentEntries.get(0);
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

        return WorkConfigResponse.fromEntity(workConfigRepository.save(config));
    }

    public void deleteWorkEntryPair(String username, Long clockInId) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Get the clock-in entry
        WorkEntry clockIn = workEntryRepository.findById(clockInId)
            .orElseThrow(() -> new RuntimeException("Work entry not found"));

        // Verify ownership
        if (!clockIn.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this entry");
        }

        // Verify it's a clock-in entry
        if (clockIn.getType() != EntryType.CLOCK_IN) {
            throw new RuntimeException("Selected entry is not a clock-in entry");
        }

        // Find the corresponding clock-out entry
        WorkEntry clockOut = workEntryRepository.findFirstByUserAndTimestampGreaterThanAndTypeOrderByTimestampAsc(
            user, clockIn.getTimestamp(), EntryType.CLOCK_OUT);

        if (clockOut != null) {
            workEntryRepository.delete(clockOut);
        }
        workEntryRepository.delete(clockIn);
    }

    public WorkEntryResponse addManualWorkEntry(String username, ManualWorkEntryRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate times
        if (request.startTime() == null || request.endTime() == null) {
            throw new RuntimeException("Start time and end time are required");
        }
        if (request.startTime().isAfter(request.endTime())) {
            throw new RuntimeException("Start time must be before end time");
        }

        // Create clock-in entry
        WorkEntry clockIn = new WorkEntry();
        clockIn.setUser(user);
        clockIn.setTimestamp(request.startTime());
        clockIn.setType(EntryType.CLOCK_IN);
        clockIn.setNotes(request.notes());
        workEntryRepository.save(clockIn);

        // Create clock-out entry
        WorkEntry clockOut = new WorkEntry();
        clockOut.setUser(user);
        clockOut.setTimestamp(request.endTime());
        clockOut.setType(EntryType.CLOCK_OUT);
        clockOut.setNotes(request.notes());
        workEntryRepository.save(clockOut);

        return WorkEntryResponse.fromEntity(clockIn);
    }

    public WorkEntryResponse editWorkEntry(String username, Long entryId, EditWorkEntryRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Get the entry to edit
        WorkEntry entry = workEntryRepository.findById(entryId)
            .orElseThrow(() -> new RuntimeException("Work entry not found"));

        // Verify ownership
        if (!entry.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to edit this entry");
        }

        // Validate new timestamp
        if (request.newTimestamp() == null) {
            throw new RuntimeException("New timestamp is required");
        }

        // Get the paired entry (clock-in or clock-out)
        WorkEntry pairedEntry;
        if (entry.getType() == EntryType.CLOCK_IN) {
            pairedEntry = workEntryRepository.findFirstByUserAndTimestampGreaterThanAndTypeOrderByTimestampAsc(
                user, entry.getTimestamp(), EntryType.CLOCK_OUT);
        } else {
            pairedEntry = workEntryRepository.findFirstByUserAndTimestampLessThanAndTypeOrderByTimestampDesc(
                user, entry.getTimestamp(), EntryType.CLOCK_IN);
        }

        // Validate timestamp order
        if (entry.getType() == EntryType.CLOCK_IN && pairedEntry != null) {
            if (request.newTimestamp().isAfter(pairedEntry.getTimestamp())) {
                throw new RuntimeException("Clock-in time must be before clock-out time");
            }
        } else if (entry.getType() == EntryType.CLOCK_OUT && pairedEntry != null) {
            if (request.newTimestamp().isBefore(pairedEntry.getTimestamp())) {
                throw new RuntimeException("Clock-out time must be after clock-in time");
            }
        }

        // Update the entry
        entry.setTimestamp(request.newTimestamp());
        if (request.notes() != null) {
            entry.setNotes(request.notes());
        }

        return WorkEntryResponse.fromEntity(workEntryRepository.save(entry));
    }

    public List<WorkEntryResponse> getEntriesByPage(String username, int page) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<WorkEntry> entries = workEntryRepository.findByUserOrderByTimestampDesc(user)
            .stream()
            .skip((long) page * PAGE_SIZE)
            .limit(PAGE_SIZE)
            .collect(Collectors.toList());

        return entries.stream()
            .map(WorkEntryResponse::fromEntity)
            .collect(Collectors.toList());
    }
} 