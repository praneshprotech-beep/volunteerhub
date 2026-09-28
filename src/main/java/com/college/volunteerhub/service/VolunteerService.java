package com.college.volunteerhub.service;

import com.college.volunteerhub.entity.Volunteer;
import com.college.volunteerhub.exception.ResourceNotFoundException;
import com.college.volunteerhub.repository.VolunteerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VolunteerService {

    private final VolunteerRepository volunteerRepository;

    public VolunteerService(VolunteerRepository volunteerRepository) {
        this.volunteerRepository = volunteerRepository;
    }

    @Transactional(readOnly = true)
    public List<Volunteer> getAllVolunteers() {
        return volunteerRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Volunteer getVolunteerById(Long id) {
        return volunteerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", id));
    }

    public Volunteer createVolunteer(Volunteer volunteer) {
        volunteer.setId(null);
        return volunteerRepository.save(volunteer);
    }

    public Volunteer updateVolunteer(Long id, Volunteer volunteerDetails) {
        Volunteer volunteer = getVolunteerById(id);
        volunteer.setName(volunteerDetails.getName());
        volunteer.setEmail(volunteerDetails.getEmail());
        volunteer.setPhone(volunteerDetails.getPhone());
        return volunteerRepository.save(volunteer);
    }

    public void deleteVolunteer(Long id) {
        volunteerRepository.delete(getVolunteerById(id));
    }
}