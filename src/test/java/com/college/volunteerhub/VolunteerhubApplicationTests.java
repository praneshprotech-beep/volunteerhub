package com.college.volunteerhub;

import com.college.volunteerhub.dto.AttendanceRecordRequest;
import com.college.volunteerhub.dto.SignUpRequest;
import com.college.volunteerhub.entity.Event;
import com.college.volunteerhub.entity.Volunteer;
import com.college.volunteerhub.exception.BusinessRuleException;
import com.college.volunteerhub.repository.AttendanceRecordRepository;
import com.college.volunteerhub.repository.EventRepository;
import com.college.volunteerhub.repository.SignUpRepository;
import com.college.volunteerhub.repository.VolunteerRepository;
import com.college.volunteerhub.service.AttendanceRecordService;
import com.college.volunteerhub.service.SignUpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VolunteerhubApplicationTests {

	@Mock
	private SignUpRepository signUpRepository;

	@Mock
	private VolunteerRepository volunteerRepository;

	@Mock
	private EventRepository eventRepository;

	@Mock
	private AttendanceRecordRepository attendanceRecordRepository;

	private SignUpService signUpService;
	private AttendanceRecordService attendanceRecordService;

	@BeforeEach
	void setUp() {
		signUpService = new SignUpService(signUpRepository, volunteerRepository, eventRepository);
		attendanceRecordService = new AttendanceRecordService(
				attendanceRecordRepository, volunteerRepository, eventRepository);
	}

	@Test
	void rejectsSignUpWhenEventCapacityIsFull() {
		Volunteer volunteer = new Volunteer();
		volunteer.setId(1L);
		Event event = new Event();
		event.setId(2L);
		event.setVolunteerCapacity(1);

		when(volunteerRepository.findById(1L)).thenReturn(Optional.of(volunteer));
		when(eventRepository.findById(2L)).thenReturn(Optional.of(event));
		when(signUpRepository.existsByVolunteerIdAndEventId(1L, 2L)).thenReturn(false);
		when(signUpRepository.countByEventId(2L)).thenReturn(1L);

		assertThrows(BusinessRuleException.class,
				() -> signUpService.createSignUp(new SignUpRequest(1L, 2L, null, "CONFIRMED")));

		verify(signUpRepository, never()).save(org.mockito.ArgumentMatchers.any());
	}

	@Test
	void rejectsDuplicateSignUp() {
		Volunteer volunteer = new Volunteer();
		volunteer.setId(1L);
		Event event = new Event();
		event.setId(2L);
		event.setVolunteerCapacity(10);

		when(volunteerRepository.findById(1L)).thenReturn(Optional.of(volunteer));
		when(eventRepository.findById(2L)).thenReturn(Optional.of(event));
		when(signUpRepository.existsByVolunteerIdAndEventId(1L, 2L)).thenReturn(true);

		assertThrows(BusinessRuleException.class,
				() -> signUpService.createSignUp(new SignUpRequest(1L, 2L, null, "CONFIRMED")));

		verify(signUpRepository, never()).save(org.mockito.ArgumentMatchers.any());
	}

	@Test
	void rejectsPositiveHoursWhenVolunteerDidNotAttend() {
		AttendanceRecordRequest request = new AttendanceRecordRequest(1L, 2L, false, 2);

		assertThrows(BusinessRuleException.class,
				() -> attendanceRecordService.createAttendanceRecord(request));

		verify(attendanceRecordRepository, never()).save(org.mockito.ArgumentMatchers.any());
	}

	@Test
	void requiresPositiveHoursWhenVolunteerAttended() {
		AttendanceRecordRequest request = new AttendanceRecordRequest(1L, 2L, true, 0);

		assertThrows(BusinessRuleException.class,
				() -> attendanceRecordService.createAttendanceRecord(request));

		verify(attendanceRecordRepository, never()).save(org.mockito.ArgumentMatchers.any());
	}

}
