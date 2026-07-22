export interface CredentialCheck {
  valid: boolean;
  hint: string;
}

export function checkEmail(value: string): CredentialCheck {
  const email = value.trim();
  if (!email) return { valid: false, hint: '请输入邮箱地址' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, hint: '邮箱格式不正确' };
  return { valid: true, hint: '验证码将发送到此邮箱' };
}

export function checkPassword(value: string): CredentialCheck {
  if (value.length < 8) return { valid: false, hint: '至少 8 位字符' };
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return { valid: false, hint: '建议同时包含字母和数字' };
  return { valid: true, hint: '密码强度符合要求' };
}

export function checkDisplayName(value: string): CredentialCheck {
  const name = value.trim();
  if (name.length < 2) return { valid: false, hint: '显示名称至少 2 个字符' };
  if (name.length > 32) return { valid: false, hint: '显示名称不能超过 32 个字符' };
  return { valid: true, hint: '其他玩家将看到此名称' };
}

export const normalizeOtp = (value: string) => value.replace(/\D/g, '').slice(0, 6);
