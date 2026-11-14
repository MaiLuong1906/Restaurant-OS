import { describe, it, expect, beforeEach } from 'vitest';
import { useQuickActionIntentStore } from '../useQuickActionIntentStore';

describe('useQuickActionIntentStore', () => {
  beforeEach(() => {
    useQuickActionIntentStore.getState().clearPosIntent();
    useQuickActionIntentStore.getState().clearPendingReservationSubTab();
    useQuickActionIntentStore.getState().clearPendingSplitMerge();
  });

  it('khởi tạo với posIntent = null, pendingReservationSubTab = null, pendingSplitMerge = false', () => {
    expect(useQuickActionIntentStore.getState().posIntent).toBeNull();
    expect(useQuickActionIntentStore.getState().pendingReservationSubTab).toBeNull();
    expect(useQuickActionIntentStore.getState().pendingSplitMerge).toBe(false);
  });

  it('cập nhật intent checkin chính xác', () => {
    useQuickActionIntentStore.getState().setPosIntent('checkin');
    expect(useQuickActionIntentStore.getState().posIntent).toBe('checkin');
  });

  it('cập nhật intent splitmerge chính xác', () => {
    useQuickActionIntentStore.getState().setPosIntent('splitmerge');
    expect(useQuickActionIntentStore.getState().posIntent).toBe('splitmerge');
  });

  it('cập nhật intent settlement chính xác', () => {
    useQuickActionIntentStore.getState().setPosIntent('settlement');
    expect(useQuickActionIntentStore.getState().posIntent).toBe('settlement');
  });

  it('clearPosIntent đưa intent về null', () => {
    useQuickActionIntentStore.getState().setPosIntent('settlement');
    expect(useQuickActionIntentStore.getState().posIntent).toBe('settlement');
    useQuickActionIntentStore.getState().clearPosIntent();
    expect(useQuickActionIntentStore.getState().posIntent).toBeNull();
  });

  it('cập nhật pendingReservationSubTab và clear chính xác', () => {
    useQuickActionIntentStore.getState().setPendingReservationSubTab('checkin');
    expect(useQuickActionIntentStore.getState().pendingReservationSubTab).toBe('checkin');

    useQuickActionIntentStore.getState().setPendingReservationSubTab('create');
    expect(useQuickActionIntentStore.getState().pendingReservationSubTab).toBe('create');

    useQuickActionIntentStore.getState().clearPendingReservationSubTab();
    expect(useQuickActionIntentStore.getState().pendingReservationSubTab).toBeNull();
  });

  it('cập nhật pendingSplitMerge và clear chính xác', () => {
    useQuickActionIntentStore.getState().setPendingSplitMerge(true);
    expect(useQuickActionIntentStore.getState().pendingSplitMerge).toBe(true);

    useQuickActionIntentStore.getState().clearPendingSplitMerge();
    expect(useQuickActionIntentStore.getState().pendingSplitMerge).toBe(false);
  });

  it('các trường trạng thái hoạt động độc lập không can thiệp lẫn nhau', () => {
    useQuickActionIntentStore.getState().setPosIntent('checkin');
    useQuickActionIntentStore.getState().setPendingReservationSubTab('checkin');
    useQuickActionIntentStore.getState().setPendingSplitMerge(true);

    expect(useQuickActionIntentStore.getState().posIntent).toBe('checkin');
    expect(useQuickActionIntentStore.getState().pendingReservationSubTab).toBe('checkin');
    expect(useQuickActionIntentStore.getState().pendingSplitMerge).toBe(true);

    useQuickActionIntentStore.getState().clearPendingReservationSubTab();
    expect(useQuickActionIntentStore.getState().posIntent).toBe('checkin');
    expect(useQuickActionIntentStore.getState().pendingReservationSubTab).toBeNull();
    expect(useQuickActionIntentStore.getState().pendingSplitMerge).toBe(true);

    useQuickActionIntentStore.getState().clearPendingSplitMerge();
    expect(useQuickActionIntentStore.getState().posIntent).toBe('checkin');
    expect(useQuickActionIntentStore.getState().pendingSplitMerge).toBe(false);

    useQuickActionIntentStore.getState().clearPosIntent();
    expect(useQuickActionIntentStore.getState().posIntent).toBeNull();
  });
});
