package com.restaurantos.repository;

import com.restaurantos.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByUsernameAndDeletedAtIsNull(String username);

    Optional<UserEntity> findByEmailAndDeletedAtIsNull(String email);

    Optional<UserEntity> findByPhoneAndDeletedAtIsNull(String phone);

    Optional<UserEntity> findByEmployeeCodeIgnoreCaseAndDeletedAtIsNull(String employeeCode);

    boolean existsByUsernameAndDeletedAtIsNull(String username);

    boolean existsByUsername(String username);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    boolean existsByEmail(String email);

    boolean existsByPhoneAndDeletedAtIsNull(String phone);

    boolean existsByPhone(String phone);

    List<UserEntity> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

    @Query("SELECT u FROM UserEntity u WHERE u.deletedAt IS NULL AND UPPER(u.role.code) = UPPER(:roleCode) ORDER BY u.createdAt DESC")
    List<UserEntity> findAllByRoleCodeAndDeletedAtIsNull(@Param("roleCode") String roleCode);

    @Query("SELECT u.employeeCode FROM UserEntity u WHERE u.employeeCode LIKE CONCAT(:prefix, '%')")
    List<String> findEmployeeCodesByPrefix(@Param("prefix") String prefix);

    @Query("SELECT u FROM UserEntity u WHERE u.deletedAt IS NULL " +
           "AND (:roleCode IS NULL OR :roleCode = '' OR UPPER(:roleCode) = 'ALL' OR UPPER(u.role.code) = UPPER(:roleCode)) " +
           "AND (:isActive IS NULL OR u.isActive = :isActive) " +
           "AND (:search IS NULL OR :search = '' OR " +
           "     LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.employeeCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     (u.phone IS NOT NULL AND u.phone LIKE CONCAT('%', :search, '%'))) " +
           "ORDER BY u.createdAt DESC")
    List<UserEntity> searchUsers(
            @Param("roleCode") String roleCode,
            @Param("search") String search,
            @Param("isActive") Boolean isActive);

    @Query(value = "SELECT u FROM UserEntity u WHERE u.deletedAt IS NULL " +
           "AND (:roleCode IS NULL OR :roleCode = '' OR UPPER(:roleCode) = 'ALL' OR UPPER(u.role.code) = UPPER(:roleCode)) " +
           "AND (:isActive IS NULL OR u.isActive = :isActive) " +
           "AND (:search IS NULL OR :search = '' OR " +
           "     LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.employeeCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     (u.phone IS NOT NULL AND u.phone LIKE CONCAT('%', :search, '%')))",
           countQuery = "SELECT count(u) FROM UserEntity u WHERE u.deletedAt IS NULL " +
           "AND (:roleCode IS NULL OR :roleCode = '' OR UPPER(:roleCode) = 'ALL' OR UPPER(u.role.code) = UPPER(:roleCode)) " +
           "AND (:isActive IS NULL OR u.isActive = :isActive) " +
           "AND (:search IS NULL OR :search = '' OR " +
           "     LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.employeeCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     (u.phone IS NOT NULL AND u.phone LIKE CONCAT('%', :search, '%')))")
    Page<UserEntity> searchUsersPaged(
            @Param("roleCode") String roleCode,
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            Pageable pageable);
}
