package de.timbang.backend.migration;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import de.timbang.backend.model.User;
import de.timbang.backend.model.WorkEntry;
import de.timbang.backend.model.WorkSession;
import de.timbang.backend.repository.UserRepository;
import de.timbang.backend.repository.WorkEntryRepository;
import de.timbang.backend.repository.WorkSessionRepository;

@Component
public class WorkEntryToSessionMigration implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(WorkEntryToSessionMigration.class);

    @Autowired
    private WorkEntryRepository workEntryRepository;

    @Autowired
    private WorkSessionRepository workSessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        logger.info("Starting WorkEntry to WorkSession migration...");
        
        // Check if migration is needed
        long workEntryCount = workEntryRepository.count();
        long workSessionCount = workSessionRepository.count();
        
        if (workEntryCount == 0) {
            logger.info("No WorkEntry data found. Migration not needed.");
            return;
        }
        
        if (workSessionCount > 0) {
            logger.warn("WorkSession data already exists. Skipping migration to avoid data duplication.");
            return;
        }
        
        logger.info("Found {} WorkEntry records to migrate", workEntryCount);
        
        // Get all users
        List<User> users = userRepository.findAll();
        
        for (User user : users) {
            migrateUserEntries(user);
        }
        
        logger.info("Migration completed successfully!");
    }
    
    private void migrateUserEntries(User user) {
        logger.info("Migrating entries for user: {}", user.getUsername());
        
        // Get all entries for this user, ordered by timestamp
        List<WorkEntry> userEntries = workEntryRepository.findByUserOrderByTimestampDesc(user);
        
        if (userEntries.isEmpty()) {
            logger.info("No entries found for user: {}", user.getUsername());
            return;
        }
        
        // Group entries by type
        Map<WorkEntry.EntryType, List<WorkEntry>> entriesByType = userEntries.stream()
                .collect(Collectors.groupingBy(WorkEntry::getType));
        
        List<WorkEntry> clockInEntries = entriesByType.getOrDefault(WorkEntry.EntryType.CLOCK_IN, new ArrayList<>());
        List<WorkEntry> clockOutEntries = entriesByType.getOrDefault(WorkEntry.EntryType.CLOCK_OUT, new ArrayList<>());
        
        logger.info("Found {} clock-in entries and {} clock-out entries for user: {}", 
                clockInEntries.size(), clockOutEntries.size(), user.getUsername());
        
        // Create sessions from paired entries
        int sessionsCreated = 0;
        int orphanedEntries = 0;
        
        for (WorkEntry clockInEntry : clockInEntries) {
            // Find the corresponding clock-out entry
            WorkEntry correspondingClockOut = findCorrespondingClockOut(clockInEntry, clockOutEntries);
            
            if (correspondingClockOut != null) {
                // Create a complete session
                WorkSession session = new WorkSession();
                session.setUser(user);
                session.setStartTime(clockInEntry.getTimestamp());
                session.setEndTime(correspondingClockOut.getTimestamp());
                
                // Combine notes (prefer clock-in notes, fallback to clock-out notes)
                String notes = clockInEntry.getNotes();
                if (notes == null || notes.trim().isEmpty()) {
                    notes = correspondingClockOut.getNotes();
                }
                session.setNotes(notes);
                
                workSessionRepository.save(session);
                sessionsCreated++;
                
                // Remove the used clock-out entry to avoid duplicates
                clockOutEntries.remove(correspondingClockOut);
                
                logger.debug("Created session: {} - {} ({}h)", 
                        session.getStartTime(), session.getEndTime(),
                        calculateHours(session.getStartTime(), session.getEndTime()));
            } else {
                // Create an incomplete session (only clock-in)
                WorkSession session = new WorkSession();
                session.setUser(user);
                session.setStartTime(clockInEntry.getTimestamp());
                session.setEndTime(null); // Incomplete session
                session.setNotes(clockInEntry.getNotes());
                
                workSessionRepository.save(session);
                sessionsCreated++;
                orphanedEntries++;
                
                logger.debug("Created incomplete session: {} (no clock-out found)", session.getStartTime());
            }
        }
        
        // Handle any remaining clock-out entries (orphaned)
        for (WorkEntry clockOutEntry : clockOutEntries) {
            logger.warn("Found orphaned clock-out entry for user {} at {}", 
                    user.getUsername(), clockOutEntry.getTimestamp());
            orphanedEntries++;
        }
        
        logger.info("User {} migration complete: {} sessions created, {} orphaned entries", 
                user.getUsername(), sessionsCreated, orphanedEntries);
    }
    
    private WorkEntry findCorrespondingClockOut(WorkEntry clockInEntry, List<WorkEntry> clockOutEntries) {
        // Find the first clock-out entry that comes after this clock-in entry
        return clockOutEntries.stream()
                .filter(clockOut -> clockOut.getTimestamp().isAfter(clockInEntry.getTimestamp()))
                .min((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()))
                .orElse(null);
    }
    
    private double calculateHours(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        return java.time.Duration.between(start, end).toMinutes() / 60.0;
    }
} 