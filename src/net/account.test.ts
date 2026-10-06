import { describe, expect, it } from 'vitest';
import { checkLogin, cleanUsername, usernameEmail, usernameOf } from './account';

describe('username accounts', () => {
  it('turns a username into a placeholder email and back', () => {
    expect(usernameEmail('  @Musa_01 ')).toBe('musa_01@player.example.com');
    expect(usernameOf('musa_01@player.example.com')).toBe('musa_01');
    expect(usernameOf('someone@gmail.com')).toBeNull();
    expect(usernameOf(undefined)).toBeNull();
    expect(cleanUsername('ADA')).toBe('ada');
  });

  it('checks usernames and passwords', () => {
    expect(checkLogin('ab', '123456')).toMatch(/Username/);
    expect(checkLogin('musa boy', '123456')).toMatch(/Username/);
    expect(checkLogin('musa', '123')).toMatch(/Password/);
    expect(checkLogin('Musa_1', 'abcdef')).toBeNull();
  });
});
