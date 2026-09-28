package com.college.volunteerhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Event name is required")
    private String eventName;

    @NotNull(message = "Event date is required")
    @FutureOrPresent(message = "Event date cannot be in the past")
    private LocalDate eventDate;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Volunteer capacity is required")
    @Positive(message = "Volunteer capacity must be positive")
    private Integer volunteerCapacity;

    @JsonIgnore
    @OneToMany(mappedBy = "event")
    private List<SignUp> signUps = new ArrayList<>();

    public Event() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Integer getVolunteerCapacity() {
        return volunteerCapacity;
    }

    public void setVolunteerCapacity(Integer volunteerCapacity) {
        this.volunteerCapacity = volunteerCapacity;
    }

    public List<SignUp> getSignUps() {
        return signUps;
    }

    public void setSignUps(List<SignUp> signUps) {
        this.signUps = signUps;
    }
}