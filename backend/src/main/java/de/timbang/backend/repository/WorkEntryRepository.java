package de.timbang.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import de.timbang.backend.model.User;
import de.timbang.backend.model.WorkEntry;
import de.timbang.backend.model.WorkEntry.EntryType;

@Repository
public interface WorkEntryRepository extends JpaRepository<WorkEntry, Long> {
    List<WorkEntry> findByUserOrderByIdDesc(User user);
    
    List<WorkEntry> findByUserAndTimestampBetweenOrderByTimestampDesc(
        User user, 
        LocalDateTime start, 
        LocalDateTime end
    );

    @Query("SELECT w FROM WorkEntry w WHERE w.user = ?1 AND w.type = de.timbang.backend.model.WorkEntry.EntryType.CLOCK_IN AND NOT EXISTS (SELECT w2 FROM WorkEntry w2 WHERE w2.user = w.user AND w2.timestamp > w.timestamp AND w2.type = de.timbang.backend.model.WorkEntry.EntryType.CLOCK_OUT)")
    List<WorkEntry> findOpenEntries(User user);

    WorkEntry findFirstByUserAndTimestampGreaterThanAndTypeOrderByTimestampAsc(
        User user,
        LocalDateTime timestamp,
        EntryType type
    );

    WorkEntry findFirstByUserAndTimestampLessThanAndTypeOrderByTimestampDesc(
        User user,
        LocalDateTime timestamp,
        EntryType type
    );
}