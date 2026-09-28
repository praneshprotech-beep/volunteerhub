package com.college.volunteerhub.controller;

import com.college.volunteerhub.dto.SignUpRequest;
import com.college.volunteerhub.entity.SignUp;
import com.college.volunteerhub.service.SignUpService;
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
@RequestMapping("/api/signups")
public class SignUpController {

    private final SignUpService signUpService;

    public SignUpController(SignUpService signUpService) {
        this.signUpService = signUpService;
    }

    @GetMapping
    public List<SignUp> getAllSignUps() {
        return signUpService.getAllSignUps();
    }

    @GetMapping("/{id}")
    public SignUp getSignUpById(@PathVariable Long id) {
        return signUpService.getSignUpById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SignUp createSignUp(@Valid @RequestBody SignUpRequest request) {
        return signUpService.createSignUp(request);
    }

    @PutMapping("/{id}")
    public SignUp updateSignUp(@PathVariable Long id, @Valid @RequestBody SignUpRequest request) {
        return signUpService.updateSignUp(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSignUp(@PathVariable Long id) {
        signUpService.deleteSignUp(id);
    }
}