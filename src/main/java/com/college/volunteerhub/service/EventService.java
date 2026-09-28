package com.college.volunteerhub.service;

import com.college.volunteerhub.entity.Event;
import com.college.volunteerhub.exception.BusinessRuleException;
import com.college.volunteerhub.exception.ResourceNotFoundException;
import com.college.volunteerhub.repository.EventRepository;
import com.college.volunteerhub.repository.SignUpRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EventService {

    private final EventRepository eventRepository;
    private final SignUpRepository signUpRepository;

    public EventService(EventRepository eventRepository, SignUpRepository signUpRepository) {
        this.eventRepository = eventRepository;
        this.signUpRepository = signUpRepository;
    }

    @Transactional(readOnly = true)
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id));
    }

    public Event createEvent(Event event) {
        event.setId(null);
        return eventRepository.save(event);
    }

    public Event updateEvent(Long id, Event eventDetails) {
        Event event = getEventById(id);
        long currentSignUps = signUpRepository.countByEventId(id);
        if (eventDetails.getVolunteerCapacity() < currentSignUps) {
            throw new BusinessRuleException(
                    "Capacity cannot be lower than the " + currentSignUps + " existing signups.");
        }

        event.setEventName(eventDetails.getEventName());
        event.setEventDate(eventDetails.getEventDate());
        event.setLocation(eventDetails.getLocation());
        event.setVolunteerCapacity(eventDetails.getVolunteerCapacity());
        return eventRepository.save(event);
    }

    public void deleteEvent(Long id) {
        eventRepository.delete(getEventById(id));
    }
}