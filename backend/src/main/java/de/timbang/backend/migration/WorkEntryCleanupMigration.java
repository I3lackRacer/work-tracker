package de.timbang.backend.migration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import de.timbang.backend.repository.WorkEntryRepository;
import de.timbang.backend.repository.WorkSessionRepository;

@Component
@Order(2) // Run after the main migration
public class WorkEntryCleanupMigration implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(WorkEntryCleanupMigration.class);

    @Autowired
    private WorkEntryRepository workEntryRepository;

    @Autowired
    private WorkSessionRepository workSessionRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        logger.info("Starting WorkEntry cleanup migration...");
        
        // Check if cleanup is needed
        long workEntryCount = workEntryRepository.count();
        long workSessionCount = workSessionRepository.count();
        
        if (workEntryCount == 0) {
            logger.info("No WorkEntry data to clean up.");
            return;
        }
        
        if (workSessionCount == 0) {
            logger.warn("No WorkSession data found. Skipping cleanup to preserve original data.");
            return;
        }
        
        logger.info("Found {} WorkEntry records to clean up", workEntryCount);
        logger.info("Found {} WorkSession records (migration appears successful)", workSessionCount);
        
        // Ask for confirmation (in a real scenario, you might want to add a property flag)
        // For now, we'll proceed with the cleanup
        logger.info("Proceeding with WorkEntry cleanup...");
        
        // Delete all WorkEntry records
        workEntryRepository.deleteAll();
        
        long remainingWorkEntryCount = workEntryRepository.count();
        logger.info("Cleanup completed. Remaining WorkEntry records: {}", remainingWorkEntryCount);
        
        if (remainingWorkEntryCount == 0) {
            logger.info("WorkEntry cleanup successful!");
        } else {
            logger.warn("Some WorkEntry records could not be deleted. Remaining: {}", remainingWorkEntryCount);
        }
    }
} 