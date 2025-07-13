package de.timbang.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Date;

@Entity
@Data
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;
    private String name;
    private  String description;

    @Enumerated(EnumType.ORDINAL)
    private State state;

    private Holiday(
            LocalDate date,
            String name,
            String description,
            State state
    ) {
        this.date = date;
        this.name = name;
        this.description = description;
        this.state = state;
    }

    public Holiday() {

    }

    public static HolidayBuilder builder() {
        return new HolidayBuilder();
    }

    public static class HolidayBuilder {
        private LocalDate date;
        private String name;
        private  String description;

        private State state;

        public HolidayBuilder date(LocalDate date) {
            this.date = date;
            return this;
        }

        public HolidayBuilder name(String name) {
            this.name = name;
            return this;
        }

        public HolidayBuilder description(String description) {
            this.description = description;
            return this;
        }

        public HolidayBuilder state(State state) {
            this.state = state;
            return this;
        }

        public Holiday build() {
            Holiday holiday = new Holiday(
                    this.date,
                    this.name,
                    this.description,
                    this.state
            );
            return holiday;
        }
    }
}

