package de.timbang.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import de.timbang.backend.model.dto.response.WorkEntryResponse;
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
            WorkEntryResponse entry = workService.clockIn(auth.getName(), request);
            return ResponseEntity.ok(entry);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/clock-out")
    public ResponseEntity<?> clockOut(
            Authentication auth,
            @RequestBody(required = false) ClockEntryRequest request) {
        try {
            WorkEntryResponse entry = workService.clockOut(auth.getName(), request);
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
            List<WorkEntryResponse> entries = workService.getEntries(auth.getName(), start, end);
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
            @AuthenticationPrincipal String username,
            @RequestBody WorkConfigRequest request) {
        return ResponseEntity.ok(workService.updateConfig(username, request));
    }

    @DeleteMapping("/entries/{clockInId}")
    public ResponseEntity<Void> deleteWorkEntryPair(
            Authentication auth,
            @PathVariable Long clockInId) {
        workService.deleteWorkEntryPair(auth.getName(), clockInId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/manual-entry")
    public ResponseEntity<?> addManualWorkEntry(
            Authentication auth,
            @RequestBody ManualWorkEntryRequest request) {
        try {
            WorkEntryResponse entry = workService.addManualWorkEntry(auth.getName(), request);
            return ResponseEntity.ok(entry);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/entries/{entryId}")
    public ResponseEntity<?> editWorkEntry(
            Authentication auth,
            @PathVariable Long entryId,
            @RequestBody EditWorkEntryRequest request) {
        try {
            WorkEntryResponse entry = workService.editWorkEntry(auth.getName(), entryId, request);
            return ResponseEntity.ok(entry);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
} 