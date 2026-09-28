package com.college.volunteerhub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record SignUpRequest(
        @NotNull(message = "Volunteer ID is required") @Positive(message = "Volunteer ID must be positive")
        Long volunteerId,
        @NotNull(message = "Event ID is required") @Positive(message = "Event ID must be positive")
        Long eventId,
        @PastOrPresent(message = "Signup date cannot be in the future")
        LocalDate signupDate,
        @NotBlank(message = "Signup status is required")
        String status) {
}