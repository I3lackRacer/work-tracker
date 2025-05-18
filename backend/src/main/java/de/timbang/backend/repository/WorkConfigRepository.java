package de.timbang.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import de.timbang.backend.model.User;
import de.timbang.backend.model.WorkConfig;

public interface WorkConfigRepository extends JpaRepository<WorkConfig, Long> {
    Optional<WorkConfig> findByUser(User user);
} 