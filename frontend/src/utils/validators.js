const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024

export function validateEmail(email) {
  return EMAIL_PATTERN.test(email.trim()) ? '' : 'กรุณากรอกอีเมลให้ถูกต้อง'
}

export function validatePassword(password) {
  return password.length >= 8 ? '' : 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
}

export function validatePasswordConfirmation(password, confirmation) {
  return password === confirmation ? '' : 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน'
}

export function validateImageFile(file) {
  if (!file) return 'กรุณาเลือกไฟล์รูปภาพ'
  if (!IMAGE_TYPES.has(file.type)) return 'รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP เท่านั้น'
  if (file.size > MAX_IMAGE_SIZE) return 'ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB'
  return ''
}

export function validateLogin(values) {
  const errors = {}
  const emailError = validateEmail(values.email || '')
  const passwordError = validatePassword(values.password || '')
  if (emailError) errors.email = emailError
  if (passwordError) errors.password = passwordError
  return errors
}

export function validateRegistration(values) {
  const errors = validateLogin(values)
  if (!values.name?.trim()) errors.name = 'กรุณากรอกชื่อ'
  const confirmationError = validatePasswordConfirmation(
    values.password || '',
    values.confirmPassword || '',
  )
  if (confirmationError) errors.confirmPassword = confirmationError
  return errors
}
