package com.college.volunteerhub.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record AttendanceRecordRequest(
        @NotNull(message = "Volunteer ID is required") @Positive(message = "Volunteer ID must be positive")
        Long volunteerId,
        @NotNull(message = "Event ID is required") @Positive(message = "Event ID must be positive")
        Long eventId,
        @NotNull(message = "Attendance value is required")
        Boolean attended,
        @PositiveOrZero(message = "Contributed hours cannot be negative")
        Integer contributedHours) {
}