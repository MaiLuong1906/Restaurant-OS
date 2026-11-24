package com.restaurantos.service;

import com.restaurantos.common.dto.PayslipDto;
import com.restaurantos.common.dto.TipDailyEntryDto;
import com.restaurantos.common.dto.TipMonthSummaryDto;
import com.restaurantos.common.dto.TipRecordDto;
import com.restaurantos.entity.PayslipEntity;
import com.restaurantos.entity.TipRecordEntity;
import com.restaurantos.repository.PayslipRepository;
import com.restaurantos.repository.TipRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffPayrollService {

    private final PayslipRepository payslipRepository;
    private final TipRecordRepository tipRecordRepository;

    @Transactional(readOnly = true)
    public List<PayslipDto> getPayslips(UUID staffId, String month) {
        if (staffId == null) {
            throw new IllegalArgumentException("staffId không được để trống");
        }
        List<PayslipEntity> entities = (month != null && !month.isBlank())
                ? payslipRepository.findByStaffIdAndMonthOrderByMonthDesc(staffId, month.trim())
                : payslipRepository.findByStaffIdOrderByMonthDesc(staffId);

        return entities.stream()
                .map(this::toPayslipDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PayslipDto getPayslipById(UUID payslipId, UUID currentUserId, boolean isManagerOrOwner) {
        PayslipEntity entity = payslipRepository.findById(payslipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu lương"));

        if (currentUserId != null && !isManagerOrOwner && !currentUserId.equals(entity.getStaffId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xem phiếu lương của nhân viên khác");
        }

        return toPayslipDto(entity);
    }

    @Transactional(readOnly = true)
    public List<TipRecordDto> getTips(UUID staffId, LocalDate from, LocalDate to) {
        if (staffId == null) {
            throw new IllegalArgumentException("staffId không được để trống");
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new IllegalArgumentException("Ngày bắt đầu (from) không được lớn hơn ngày kết thúc (to)");
        }

        List<TipRecordEntity> records;
        if (from != null && to != null) {
            records = tipRecordRepository.findByStaffIdAndTipDateBetweenOrderByTipDateDesc(staffId, from, to);
        } else {
            records = tipRecordRepository.findByStaffIdOrderByTipDateDesc(staffId);
        }

        return records.stream()
                .map(this::toTipRecordDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TipMonthSummaryDto> getTipMonths(UUID staffId) {
        if (staffId == null) {
            throw new IllegalArgumentException("staffId không được để trống");
        }
        List<TipRecordEntity> records = tipRecordRepository.findByStaffIdOrderByTipDateDesc(staffId);
        if (records.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<TipRecordEntity>> byMonth = new LinkedHashMap<>();
        for (TipRecordEntity rec : records) {
            byMonth.computeIfAbsent(rec.getMonthKey(), k -> new ArrayList<>()).add(rec);
        }

        List<TipMonthSummaryDto> result = new ArrayList<>();
        boolean isFirstMonth = true;
        for (Map.Entry<String, List<TipRecordEntity>> entry : byMonth.entrySet()) {
            String monthKey = entry.getKey();
            List<TipRecordEntity> monthRecords = entry.getValue();

            long totalAmount = monthRecords.stream()
                    .mapToLong(r -> r.getAllocatedAmount() != null ? r.getAllocatedAmount() : 0L)
                    .sum();

            TipRecordEntity first = monthRecords.get(0);
            String paymentStatus = first.getPaymentStatus() != null ? first.getPaymentStatus() : "UNPAID";
            String paymentNote = first.getPaymentNote() != null
                    ? first.getPaymentNote()
                    : ("PAID".equalsIgnoreCase(paymentStatus)
                            ? "Đã thanh toán"
                            : "Dự kiến trả cùng kỳ lương tháng " + monthKey);

            String monthLabel = isFirstMonth ? ("Tip tháng " + monthKey.substring(Math.max(0, monthKey.length() - 2)))
                    : ("Tháng " + monthKey.substring(Math.max(0, monthKey.length() - 2)) + "/" + monthKey.substring(0, 4));

            List<TipDailyEntryDto> dailyEntries = isFirstMonth
                    ? monthRecords.stream()
                            .map(r -> new TipDailyEntryDto(
                                    r.getTipDate(),
                                    r.getDateLabel() != null ? r.getDateLabel() : r.getTipDate().toString(),
                                    r.getShiftLabel(),
                                    r.getAllocatedAmount()
                            ))
                            .collect(Collectors.toList())
                    : null;

            result.add(new TipMonthSummaryDto(
                    monthKey,
                    monthLabel,
                    totalAmount,
                    paymentStatus,
                    paymentNote,
                    dailyEntries
            ));
            isFirstMonth = false;
        }

        return result;
    }

    private PayslipDto toPayslipDto(PayslipEntity e) {
        return new PayslipDto(
                e.getId(),
                e.getStaffId(),
                e.getStaffName(),
                e.getMonth(),
                e.getMonthLabel(),
                e.getStatus(),
                e.getPaymentStatus(),
                e.getPeriodLabel(),
                e.getPaymentDateLabel(),
                e.getPaymentNote(),
                e.getBaseSalary(),
                e.getWorkedHours(),
                e.getHourlyRate(),
                e.getAllowance(),
                e.getBonus(),
                e.getTipAmount(),
                e.getDeductions(),
                e.getBhxhAmount(),
                e.getAdvanceAmount(),
                e.getNetSalary(),
                e.getPaidAt()
        );
    }

    private TipRecordDto toTipRecordDto(TipRecordEntity e) {
        return new TipRecordDto(
                e.getId(),
                e.getStaffId(),
                e.getTipDate(),
                e.getPoolAmount(),
                e.getAllocatedAmount(),
                e.getNote()
        );
    }
}
