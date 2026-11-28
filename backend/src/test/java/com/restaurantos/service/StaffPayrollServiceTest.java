package com.restaurantos.service;

import com.restaurantos.common.dto.PayslipDto;
import com.restaurantos.common.dto.TipMonthSummaryDto;
import com.restaurantos.entity.PayslipEntity;
import com.restaurantos.entity.TipRecordEntity;
import com.restaurantos.repository.PayslipRepository;
import com.restaurantos.repository.TipRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffPayrollServiceTest {

    @Mock
    private PayslipRepository payslipRepository;

    @Mock
    private TipRecordRepository tipRecordRepository;

    @InjectMocks
    private StaffPayrollService staffPayrollService;

    private UUID staffId;
    private PayslipEntity samplePayslip;

    @BeforeEach
    void setUp() {
        staffId = UUID.randomUUID();
        samplePayslip = new PayslipEntity(
                UUID.randomUUID(),
                staffId,
                "Nhân Viên Vận Hành",
                "2026-11",
                "Tháng 11/2026",
                "PROVISIONAL",
                "EXPECTED",
                "01/11 – 30/11/2026",
                "10/12/2026",
                "Tạm tính",
                4000000L,
                100,
                40000L,
                200000L,
                300000L,
                0L,
                250000L,
                200000L,
                50000L,
                4250000L,
                null,
                OffsetDateTime.now(),
                OffsetDateTime.now()
        );
    }

    @Test
    @DisplayName("Lấy danh sách phiếu lương trả về số tiền nguyên VND chính xác")
    void getPayslips_returnsIntegerVndValues() {
        when(payslipRepository.findByStaffIdOrderByMonthDesc(staffId)).thenReturn(List.of(samplePayslip));

        List<PayslipDto> result = staffPayrollService.getPayslips(staffId, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getBaseSalary()).isEqualTo(4000000L);
        assertThat(result.get(0).getNetSalary()).isEqualTo(4250000L);
    }

    @Test
    @DisplayName("Chặn IDOR: nhân viên khác cố xem chi tiết phiếu lương bị chặn 403 FORBIDDEN")
    void getPayslipById_blocksIdor() {
        UUID payslipId = samplePayslip.getId();
        UUID otherStaffId = UUID.randomUUID();
        when(payslipRepository.findById(payslipId)).thenReturn(Optional.of(samplePayslip));

        assertThatThrownBy(() -> staffPayrollService.getPayslipById(payslipId, otherStaffId, false))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    @DisplayName("Tổng hợp Tip theo tháng: gom nhóm đúng tổng VND và đính kèm dailyEntries cho tháng mới nhất")
    void getTipMonths_aggregatesByMonthKey() {
        TipRecordEntity tip1 = new TipRecordEntity(
                UUID.randomUUID(), staffId, LocalDate.of(2026, 11, 5), "2026-11",
                "Thứ Năm, 05/11", "Ca sáng", 380000L, 95000L, "UNPAID",
                "Dự kiến trả 10/12/2026", "Ca sáng", OffsetDateTime.now(), OffsetDateTime.now()
        );
        TipRecordEntity tip2 = new TipRecordEntity(
                UUID.randomUUID(), staffId, LocalDate.of(2026, 11, 4), "2026-11",
                "Thứ Tư, 04/11", "Ca tối", 340000L, 85000L, "UNPAID",
                "Dự kiến trả 10/12/2026", "Ca tối", OffsetDateTime.now(), OffsetDateTime.now()
        );
        TipRecordEntity tipOct = new TipRecordEntity(
                UUID.randomUUID(), staffId, LocalDate.of(2026, 10, 28), "2026-10",
                "28/10", "Ca tối", 500000L, 125000L, "PAID",
                "Đã thanh toán 10/11/2026", null, OffsetDateTime.now(), OffsetDateTime.now()
        );

        when(tipRecordRepository.findByStaffIdOrderByTipDateDesc(staffId))
                .thenReturn(List.of(tip1, tip2, tipOct));

        List<TipMonthSummaryDto> months = staffPayrollService.getTipMonths(staffId);

        assertThat(months).hasSize(2);
        assertThat(months.get(0).getMonthKey()).isEqualTo("2026-11");
        assertThat(months.get(0).getTotalAmount()).isEqualTo(180000L);
        assertThat(months.get(0).getDailyEntries()).hasSize(2);
        assertThat(months.get(1).getMonthKey()).isEqualTo("2026-10");
        assertThat(months.get(1).getTotalAmount()).isEqualTo(125000L);
        assertThat(months.get(1).getDailyEntries()).isNull();
    }
}
