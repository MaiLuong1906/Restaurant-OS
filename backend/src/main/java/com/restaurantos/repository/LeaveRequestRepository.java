package com.restaurantos.repository;

import com.restaurantos.entity.LeaveRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequestEntity, UUID> {
    List<LeaveRequestEntity> findByStaffIdOrderByCreatedAtDesc(UUID staffId);
    Optional<LeaveRequestEntity> findByIdempotencyKey(String idempotencyKey);
}
