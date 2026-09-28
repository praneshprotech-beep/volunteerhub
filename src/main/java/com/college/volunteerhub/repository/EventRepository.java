package com.college.volunteerhub.repository;

import com.college.volunteerhub.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
}