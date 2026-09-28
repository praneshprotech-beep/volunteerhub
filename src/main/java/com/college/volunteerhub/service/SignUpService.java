package com.college.volunteerhub.service;

import com.college.volunteerhub.dto.SignUpRequest;
import com.college.volunteerhub.entity.Event;
import com.college.volunteerhub.entity.SignUp;
import com.college.volunteerhub.entity.Volunteer;
import com.college.volunteerhub.exception.BusinessRuleException;
import com.college.volunteerhub.exception.ResourceNotFoundException;
import com.college.volunteerhub.repository.EventRepository;
import com.college.volunteerhub.repository.SignUpRepository;
import com.college.volunteerhub.repository.VolunteerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class SignUpService {

    private final SignUpRepository signUpRepository;
    private final VolunteerRepository volunteerRepository;
    private final EventRepository eventRepository;

    public SignUpService(
            SignUpRepository signUpRepository,
            VolunteerRepository volunteerRepository,
            EventRepository eventRepository) {
        this.signUpRepository = signUpRepository;
        this.volunteerRepository = volunteerRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional(readOnly = true)
    public List<SignUp> getAllSignUps() {
        return signUpRepository.findAll();
    }

    @Transactional(readOnly = true)
    public SignUp getSignUpById(Long id) {
        return signUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Signup", id));
    }

    public SignUp createSignUp(SignUpRequest request) {
        return saveSignUp(null, request);
    }

    public SignUp updateSignUp(Long id, SignUpRequest request) {
        return saveSignUp(getSignUpById(id), request);
    }

    public void deleteSignUp(Long id) {
        signUpRepository.delete(getSignUpById(id));
    }

    private SignUp saveSignUp(SignUp existingSignUp, SignUpRequest request) {
        Volunteer volunteer = volunteerRepository.findById(request.volunteerId())
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", request.volunteerId()));
        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", request.eventId()));

        Long currentSignUpId = existingSignUp == null ? null : existingSignUp.getId();
        boolean duplicate = currentSignUpId == null
                ? signUpRepository.existsByVolunteerIdAndEventId(volunteer.getId(), event.getId())
                : signUpRepository.existsByVolunteerIdAndEventIdAndIdNot(
                        volunteer.getId(), event.getId(), currentSignUpId);
        if (duplicate) {
            throw new BusinessRuleException("This volunteer is already signed up for this event.");
        }

        long registeredVolunteers = signUpRepository.countByEventId(event.getId());
        if (existingSignUp != null && existingSignUp.getEvent().getId().equals(event.getId())) {
            registeredVolunteers--;
        }
        if (registeredVolunteers >= event.getVolunteerCapacity()) {
            throw new BusinessRuleException("This event has reached its volunteer capacity.");
        }

        SignUp signUp = existingSignUp == null ? new SignUp() : existingSignUp;
        signUp.setVolunteer(volunteer);
        signUp.setEvent(event);
        signUp.setSignupDate(request.signupDate() != null
                ? request.signupDate()
                : existingSignUp == null ? LocalDate.now() : existingSignUp.getSignupDate());
        signUp.setStatus(request.status());
        return signUpRepository.save(signUp);
    }
}