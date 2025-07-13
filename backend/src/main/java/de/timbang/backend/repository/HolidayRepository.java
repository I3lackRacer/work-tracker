package de.timbang.backend.repository;

import de.timbang.backend.model.Holiday;
import de.timbang.backend.model.State;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface HolidayRepository extends CrudRepository<Holiday, Long> {

    List<Holiday> findHolidayByState(State state);
}
