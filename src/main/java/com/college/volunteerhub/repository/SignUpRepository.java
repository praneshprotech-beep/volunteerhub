package com.college.volunteerhub.repository;

import com.college.volunteerhub.entity.SignUp;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SignUpRepository extends JpaRepository<SignUp, Long> {

    long countByEventId(Long eventId);

    boolean existsByVolunteerIdAndEventId(Long volunteerId, Long eventId);

    boolean existsByVolunteerIdAndEventIdAndIdNot(Long volunteerId, Long eventId, Long signupId);
}