package com.restaurantos.repository;

import com.restaurantos.entity.OpenShiftEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OpenShiftRepository extends JpaRepository<OpenShiftEntity, UUID> {
    List<OpenShiftEntity> findByDateKey(LocalDate dateKey);

    // Khóa dòng dữ liệu ca làm việc trong suốt giao dịch đăng ký/hủy (chống Race Condition/Overselling)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM OpenShiftEntity s WHERE s.id = :id")
    Optional<OpenShiftEntity> findByIdWithLock(@Param("id") UUID id);
}
