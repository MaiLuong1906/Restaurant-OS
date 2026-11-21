package com.restaurantos.service;

import com.restaurantos.common.dto.user.CreateUserRequest;
import com.restaurantos.common.dto.user.UpdatePinRequest;
import com.restaurantos.common.dto.user.UpdateUserRequest;
import com.restaurantos.common.dto.user.UserResponseDto;

import java.util.List;
import java.util.UUID;

public interface UserService {

    List<UserResponseDto> getAllUsers(String roleCode, String search, Boolean isActive);

    default List<UserResponseDto> getAllUsers(String roleCode, String search) {
        return getAllUsers(roleCode, search, null);
    }

    default List<UserResponseDto> getAllUsers(String roleCode) {
        return getAllUsers(roleCode, null, null);
    }

    UserResponseDto getUserByIdentifier(String identifier);

    default UserResponseDto getUserById(UUID id) {
        return getUserByIdentifier(id != null ? id.toString() : null);
    }

    UserResponseDto createUser(CreateUserRequest request);

    UserResponseDto updateUser(String identifier, UpdateUserRequest request);

    default UserResponseDto updateUser(UUID id, UpdateUserRequest request) {
        return updateUser(id != null ? id.toString() : null, request);
    }

    UserResponseDto updatePin(String identifier, UpdatePinRequest request);

    default UserResponseDto updatePin(UUID id, UpdatePinRequest request) {
        return updatePin(id != null ? id.toString() : null, request);
    }

    UserResponseDto toggleActiveStatus(String identifier);

    default UserResponseDto toggleActiveStatus(UUID id) {
        return toggleActiveStatus(id != null ? id.toString() : null);
    }

    UserResponseDto deleteUser(String identifier);

    default UserResponseDto deleteUser(UUID id) {
        return deleteUser(id != null ? id.toString() : null);
    }
}
