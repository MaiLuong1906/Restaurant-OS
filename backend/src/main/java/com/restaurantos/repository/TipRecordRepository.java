package com.restaurantos.repository;

import com.restaurantos.entity.TipRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TipRecordRepository extends JpaRepository<TipRecordEntity, UUID> {
    List<TipRecordEntity> findByStaffIdOrderByTipDateDesc(UUID staffId);
    List<TipRecordEntity> findByStaffIdAndTipDateBetweenOrderByTipDateDesc(UUID staffId, LocalDate from, LocalDate to);
}
