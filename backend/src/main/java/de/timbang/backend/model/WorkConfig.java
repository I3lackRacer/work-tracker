package de.timbang.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.boot.context.properties.bind.DefaultValue;

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

    @Enumerated(EnumType.STRING)
    private State state = State.NATIONAL;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT 1")
    private boolean showHoliday = true;
} 