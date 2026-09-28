package com.college.volunteerhub.controller;

import com.college.volunteerhub.dto.AttendanceRecordRequest;
import com.college.volunteerhub.entity.AttendanceRecord;
import com.college.volunteerhub.service.AttendanceRecordService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/attendance-records")
public class AttendanceRecordController {

    private final AttendanceRecordService attendanceRecordService;

    public AttendanceRecordController(AttendanceRecordService attendanceRecordService) {
        this.attendanceRecordService = attendanceRecordService;
    }

    @GetMapping
    public List<AttendanceRecord> getAllAttendanceRecords() {
        return attendanceRecordService.getAllAttendanceRecords();
    }

    @GetMapping("/{id}")
    public AttendanceRecord getAttendanceRecordById(@PathVariable Long id) {
        return attendanceRecordService.getAttendanceRecordById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AttendanceRecord createAttendanceRecord(@Valid @RequestBody AttendanceRecordRequest request) {
        return attendanceRecordService.createAttendanceRecord(request);
    }

    @PutMapping("/{id}")
    public AttendanceRecord updateAttendanceRecord(
            @PathVariable Long id, @Valid @RequestBody AttendanceRecordRequest request) {
        return attendanceRecordService.updateAttendanceRecord(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttendanceRecord(@PathVariable Long id) {
        attendanceRecordService.deleteAttendanceRecord(id);
    }
}