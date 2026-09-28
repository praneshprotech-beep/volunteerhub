package com.college.volunteerhub.service;

import com.college.volunteerhub.dto.AttendanceRecordRequest;
import com.college.volunteerhub.entity.AttendanceRecord;
import com.college.volunteerhub.entity.Event;
import com.college.volunteerhub.entity.Volunteer;
import com.college.volunteerhub.exception.BusinessRuleException;
import com.college.volunteerhub.exception.ResourceNotFoundException;
import com.college.volunteerhub.repository.AttendanceRecordRepository;
import com.college.volunteerhub.repository.EventRepository;
import com.college.volunteerhub.repository.VolunteerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AttendanceRecordService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final VolunteerRepository volunteerRepository;
    private final EventRepository eventRepository;

    public AttendanceRecordService(
            AttendanceRecordRepository attendanceRecordRepository,
            VolunteerRepository volunteerRepository,
            EventRepository eventRepository) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.volunteerRepository = volunteerRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecord> getAllAttendanceRecords() {
        return attendanceRecordRepository.findAll();
    }

    @Transactional(readOnly = true)
    public AttendanceRecord getAttendanceRecordById(Long id) {
        return attendanceRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record", id));
    }

    public AttendanceRecord createAttendanceRecord(AttendanceRecordRequest request) {
        return saveAttendanceRecord(null, request);
    }

    public AttendanceRecord updateAttendanceRecord(Long id, AttendanceRecordRequest request) {
        return saveAttendanceRecord(getAttendanceRecordById(id), request);
    }

    public void deleteAttendanceRecord(Long id) {
        attendanceRecordRepository.delete(getAttendanceRecordById(id));
    }

    private AttendanceRecord saveAttendanceRecord(
            AttendanceRecord existingRecord, AttendanceRecordRequest request) {
        if (Boolean.TRUE.equals(request.attended())
                && (request.contributedHours() == null || request.contributedHours() <= 0)) {
            throw new BusinessRuleException("Contributed hours must be positive when attendance is true.");
        }
        if (Boolean.FALSE.equals(request.attended())
                && request.contributedHours() != null && request.contributedHours() > 0) {
            throw new BusinessRuleException("Contributed hours cannot be recorded when attendance is false.");
        }

        Volunteer volunteer = volunteerRepository.findById(request.volunteerId())
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", request.volunteerId()));
        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", request.eventId()));

        AttendanceRecord record = existingRecord == null ? new AttendanceRecord() : existingRecord;
        record.setVolunteer(volunteer);
        record.setEvent(event);
        record.setAttended(request.attended());
        record.setContributedHours(request.contributedHours());
        return attendanceRecordRepository.save(record);
    }
}