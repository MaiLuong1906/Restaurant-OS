package com.restaurantos.repository;

import com.restaurantos.entity.PayslipEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PayslipRepository extends JpaRepository<PayslipEntity, UUID> {
    List<PayslipEntity> findByStaffIdOrderByMonthDesc(UUID staffId);
    List<PayslipEntity> findByStaffIdAndMonthOrderByMonthDesc(UUID staffId, String month);
}
