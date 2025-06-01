package de.timbang.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import lombok.Data;

@Entity
@Data
public class WorkConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    private User user;

    private Integer expectedWeeklyHours;
    private Integer expectedMonthlyHours;
    private Boolean trackLunchBreak;
    private Integer defaultLunchBreakMinutes;
    private String workDays; // Stored as comma-separated list of day numbers (1-7, where 1 is Monday)
} 