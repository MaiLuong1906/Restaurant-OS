package com.restaurantos.common.dto.user;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class UpdatePinRequest {

    public UpdatePinRequest() {
    }

    @NotBlank(message = "Mã PIN không được để trống")
    @Pattern(regexp = "^[0-9]{4,6}$", message = "Mã PIN phải gồm 4 đến 6 chữ số")
    @JsonAlias({"pin", "pinCode"})
    private String pinCode;
}

