package com.restaurantos.repository;

import com.restaurantos.entity.DiningZoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DiningZoneRepository extends JpaRepository<DiningZoneEntity, UUID> {

    List<DiningZoneEntity> findAllByOrderByDisplayOrderAsc();
}
