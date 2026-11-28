import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapCategoryToSubCategory,
  mapDtoToCustomerDish,
  isUuid,
  formatTableName,
  customerMenuService,
  CustomerDishDto,
  TableInfoDto,
} from '../customerMenuService';
import * as apiClient from '../../lib/api-client';
import { FALLBACK_DISH_IMAGE } from '../../lib/customer-menu-data';

describe('customerMenuService & Mapper Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isUuid & formatTableName utilities', () => {
    it('accurately distinguishes UUID from slug table IDs', () => {
      expect(isUuid('00000000-0000-0000-0000-000000000001')).toBe(true);
      expect(isUuid('c7b89e3a-4f51-40b9-8e27-6f81a7d65b21')).toBe(true);
      expect(isUuid('ban-04')).toBe(false);
      expect(isUuid('table-12')).toBe(false);
      expect(isUuid('invalid-uuid-string')).toBe(false);
    });

    it('formats table IDs cleanly into Vietnamese table display names', () => {
      expect(formatTableName('ban-04')).toBe('Bàn 04');
      expect(formatTableName('ban01')).toBe('Bàn 01');
      expect(formatTableName('vip-02')).toBe('Bàn VIP 02');
      expect(formatTableName('sanh-chinh-5')).toBe('Bàn SANH CHINH 5');
    });
  });

  describe('mapCategoryToSubCategory', () => {
    it('correctly maps various category aliases to customer subCategories', () => {
      expect(mapCategoryToSubCategory('KHAI_VI')).toBe('APPETIZER');
      expect(mapCategoryToSubCategory('appetizer')).toBe('APPETIZER');
      expect(mapCategoryToSubCategory('MON_CHINH')).toBe('MAIN');
      expect(mapCategoryToSubCategory('MAIN')).toBe('MAIN');
      expect(mapCategoryToSubCategory('COMBO')).toBe('MAIN');
      expect(mapCategoryToSubCategory('SOUP')).toBe('SOUP');
      expect(mapCategoryToSubCategory('MON_NUOC')).toBe('SOUP');
      expect(mapCategoryToSubCategory('LAU')).toBe('SOUP');
      expect(mapCategoryToSubCategory('TRANG_MIENG')).toBe('DESSERT');
      expect(mapCategoryToSubCategory('DESSERT')).toBe('DESSERT');
      expect(mapCategoryToSubCategory('DO_UONG')).toBe('DRINK');
      expect(mapCategoryToSubCategory('DRINK')).toBe('DRINK');
      expect(mapCategoryToSubCategory('UNKNOWN')).toBe('MAIN');
    });
  });

  describe('mapDtoToCustomerDish', () => {
    it('maps standard available dish with integer VND price and subCategory', () => {
      const dto: CustomerDishDto = {
        id: 'dish-1',
        name: 'Bún Chả Hà Nội',
        description: 'Chả nướng than hoa thơm lừng',
        price: 65000,
        category: 'MON_CHINH',
        imageUrl: 'https://cdn.example.com/buncha.jpg',
        isAvailable: true,
      };

      const result = mapDtoToCustomerDish(dto);
      expect(result.id).toBe('dish-1');
      expect(result.name).toBe('Bún Chả Hà Nội');
      expect(result.price).toBe(65000);
      expect(result.subCategory).toBe('MAIN');
      expect(result.isAvailable).toBe(true);
      expect(result.imageUrl).toBe('https://cdn.example.com/buncha.jpg');
    });

    it('handles sold-out dish (isAvailable: false) with neutral sold-out badge', () => {
      const dto: CustomerDishDto = {
        id: 'dish-2',
        name: 'Chả Cá Lã Vọng',
        description: 'Cá lăng sông Đà',
        price: 175000,
        category: 'MAIN',
        imageUrl: '',
        isAvailable: false,
        soldOutReason: 'Hết cá tươi trong ngày',
      };

      const result = mapDtoToCustomerDish(dto);
      expect(result.isAvailable).toBe(false);
      expect(result.badge).toBe('Tạm hết món');
      expect(result.badgeVariant).toBe('neutral');
      expect(result.imageUrl).toBe(FALLBACK_DISH_IMAGE);
    });

    it('maps combo dish with comboItems breakdown and special badge', () => {
      const dto: CustomerDishDto = {
        id: 'combo-1',
        name: 'Set Phố Cổ Thịnh Vượng',
        description: 'Set ăn 4 người',
        price: 499000,
        category: 'COMBO',
        isAvailable: true,
        isCombo: true,
        comboItems: [
          {
            id: 'c-1',
            dishId: 'd-1',
            dishName: 'Nem Rán Phố Cổ',
            dishPrice: 85000,
            dishCategory: 'APPETIZER',
            quantity: 2,
          },
          {
            id: 'c-2',
            dishId: 'd-2',
            dishName: 'Bún Chả Than Hoa',
            dishPrice: 95000,
            dishCategory: 'MAIN',
            quantity: 4,
          },
        ],
      };

      const result = mapDtoToCustomerDish(dto);
      expect(result.badge).toBe('Combo');
      expect(result.badgeVariant).toBe('special');
      expect(result.description).toContain('2x Nem Rán Phố Cổ, 4x Bún Chả Than Hoa');
      expect(result.subCategory).toBe('MAIN');
    });
  });

  describe('getTableInfo', () => {
    it('throws 400 ApiError for non-UUID table IDs', async () => {
      await expect(customerMenuService.getTableInfo('ban-04')).rejects.toThrow(
        'Mã QR bàn không đúng định dạng UUID'
      );
    });

    it('fetches table info from API for valid UUID', async () => {
      const mockTable: TableInfoDto = {
        id: '00000000-0000-0000-0000-000000000001',
        tableNumber: 'Bàn 01',
        capacity: 4,
        status: 'VACANT',
      };
      vi.spyOn(apiClient, 'fetchApi').mockResolvedValueOnce(mockTable);

      const result = await customerMenuService.getTableInfo(
        '00000000-0000-0000-0000-000000000001'
      );
      expect(result).toEqual(mockTable);
      expect(apiClient.fetchApi).toHaveBeenCalledWith(
        '/tables/00000000-0000-0000-0000-000000000001'
      );
    });
  });

  describe('getPublicDishes', () => {
    it('queries both available and sold-out dishes in parallel when isAvailable is not provided', async () => {
      const availableDish: CustomerDishDto = {
        id: 'd-1',
        name: 'Phở Bò Tái',
        price: 75000,
        category: 'MON_CHINH',
        isAvailable: true,
      };
      const soldOutDish: CustomerDishDto = {
        id: 'd-2',
        name: 'Chả Cá Lã Vọng',
        price: 180000,
        category: 'MON_CHINH',
        isAvailable: false,
      };

      const spy = vi
        .spyOn(apiClient, 'fetchApi')
        .mockImplementation(async (endpoint: string) => {
          if (endpoint.includes('isAvailable=true')) {
            return [availableDish];
          }
          if (endpoint.includes('isAvailable=false')) {
            return [soldOutDish];
          }
          return [];
        });

      const dishes = await customerMenuService.getPublicDishes();
      expect(dishes).toHaveLength(2);
      expect(dishes[0].name).toBe('Phở Bò Tái');
      expect(dishes[0].isAvailable).toBe(true);
      expect(dishes[1].name).toBe('Chả Cá Lã Vọng');
      expect(dishes[1].isAvailable).toBe(false);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('returns empty array when API returns empty array', async () => {
      vi.spyOn(apiClient, 'fetchApi').mockResolvedValue([]);
      const dishes = await customerMenuService.getPublicDishes();
      expect(dishes).toEqual([]);
    });

    it('throws error when API fails instead of silently returning mock', async () => {
      vi.spyOn(apiClient, 'fetchApi').mockRejectedValueOnce(
        new apiClient.ApiError('HTTP_500', 'Server Error', 500)
      );
      await expect(customerMenuService.getPublicDishes()).rejects.toThrow('Server Error');
    });
  });
});
