package com.restaurantos.repository;

import com.restaurantos.entity.ShiftRegistrationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShiftRegistrationRepository extends JpaRepository<ShiftRegistrationEntity, UUID> {
    Optional<ShiftRegistrationEntity> findByIdempotencyKey(String idempotencyKey);
    List<ShiftRegistrationEntity> findByStaffIdAndDateKey(UUID staffId, LocalDate dateKey);
    List<ShiftRegistrationEntity> findByOpenShiftId(UUID openShiftId);
}
