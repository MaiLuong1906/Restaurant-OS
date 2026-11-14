import { describe, it, expect, beforeEach } from 'vitest';
import { useQuickActionIntentStore } from '../useQuickActionIntentStore';

describe('useQuickActionIntentStore', () => {
  beforeEach(() => {
    useQuickActionIntentStore.getState().clearPosIntent();
  });

  it('khởi tạo với posIntent = null', () => {
    expect(useQuickActionIntentStore.getState().posIntent).toBeNull();
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
});
