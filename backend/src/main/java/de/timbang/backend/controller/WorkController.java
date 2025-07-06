package de.timbang.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import de.timbang.backend.model.WorkSession;
import de.timbang.backend.model.dto.response.WorkSessionResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import de.timbang.backend.model.dto.request.ClockEntryRequest;
import de.timbang.backend.model.dto.request.EditWorkEntryRequest;
import de.timbang.backend.model.dto.request.ManualWorkEntryRequest;
import de.timbang.backend.model.dto.request.WorkConfigRequest;
import de.timbang.backend.model.dto.response.WorkConfigResponse;
import de.timbang.backend.service.WorkService;

@RestController
@RequestMapping("/api/v1/work")
public class WorkController {

    @Autowired
    private WorkService workService;

    @PostMapping("/clock-in")
    public ResponseEntity<?> clockIn(
            Authentication auth,
            @RequestBody(required = false) ClockEntryRequest request) {
        try {
            WorkSessionResponse entry = workService.clockIn(auth.getName(), request);
            return ResponseEntity.ok(entry);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/clock-out/{clockInId}")
    public ResponseEntity<?> clockOut(
            Authentication auth,
            @PathVariable Long clockInId,
            @RequestBody(required = false) ClockEntryRequest request) {
        try {
            WorkSessionResponse entry = workService.clockOut(auth.getName(), clockInId, request);
            return ResponseEntity.ok(entry);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/entries")
    public ResponseEntity<?> getEntries(
            Authentication auth,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        try {
            List<WorkSessionResponse> entries = workService.getEntries(auth.getName(), start, end);
            return ResponseEntity.ok(entries);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/entries/{page}")
    public ResponseEntity<?> getEntries(
            Authentication auth,
            @PathVariable int page) {
        try {
            List<WorkSessionResponse> entries = workService.getEntriesByPage(auth.getName(), page);
            return ResponseEntity.ok(entries);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/config")
    public ResponseEntity<?> getConfig(Authentication auth) {
        try {
            WorkConfigResponse config = workService.getConfig(auth.getName());
            return ResponseEntity.ok(config);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/config")
    public ResponseEntity<WorkConfigResponse> updateConfig(
            Authentication auth,
            @RequestBody WorkConfigRequest request) {
        return ResponseEntity.ok(workService.updateConfig(auth.getName(), request));
    }

    @DeleteMapping("/entries/{sessionId}")
    public ResponseEntity<Void> deleteWorkEntryPair(
            Authentication auth,
            @PathVariable Long sessionId) {
        workService.deleteWorkEntryPair(auth.getName(), sessionId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/entries/{entryId}")
    public ResponseEntity<?> editWorkEntry(
            Authentication auth,
            @PathVariable Long entryId,
            @RequestBody EditWorkEntryRequest request) {
        try {
            WorkSessionResponse entry = workService.editWorkEntry(auth.getName(), entryId, request);
            return ResponseEntity.ok(entry);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
} 