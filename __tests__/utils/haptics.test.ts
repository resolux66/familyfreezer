/** @jest-environment node */

// 📘 Jest Note — module mocking
// jest.mock() replaces a module with an auto-generated mock where every
// exported function becomes jest.fn() returning undefined.
// We mock expo-haptics so tests never call real device APIs (which don't
// exist in the Node.js Jest environment).
//
// The Platform mock lets us simulate both 'ios' and 'web' environments
// in the same test file by mutating Platform.OS between tests.

jest.mock('expo-haptics', () => ({
  impactAsync:       jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../../src/utils/haptics';

// Helpers to set Platform.OS for each test scenario
function setOS(os: string) {
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('haptics — on native (ios)', () => {
  beforeEach(() => setOS('ios'));

  it('hapticLight calls impactAsync with Light', () => {
    hapticLight();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('hapticMedium calls impactAsync with Medium', () => {
    hapticMedium();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('hapticSuccess calls notificationAsync with Success', () => {
    hapticSuccess();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
  });

  it('hapticError calls notificationAsync with Error', () => {
    hapticError();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
  });
});

describe('haptics — on web', () => {
  beforeEach(() => setOS('web'));

  it('hapticLight does NOT call impactAsync on web', () => {
    hapticLight();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('hapticMedium does NOT call impactAsync on web', () => {
    hapticMedium();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('hapticSuccess does NOT call notificationAsync on web', () => {
    hapticSuccess();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});
