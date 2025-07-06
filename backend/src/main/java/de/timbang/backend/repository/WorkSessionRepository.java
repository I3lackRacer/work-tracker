package de.timbang.backend.repository;

import de.timbang.backend.model.User;
import de.timbang.backend.model.WorkSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WorkSessionRepository extends JpaRepository<WorkSession, Long> {

    List<WorkSession> findByUserOrderByStartTimeDesc(User user);

    Optional<WorkSession> findByIdAndUser(Long id, User user);

    List<WorkSession> findByUserAndStartTimeBetween(User user, LocalDateTime start, LocalDateTime end);

    List<WorkSession> findByUserAndStartTimeBetweenOrderById(User user, LocalDateTime start, LocalDateTime end);

    List<WorkSession> findByUserOrderById(User user);
}
