/**
 * Form validation utility functions
 * Implemented according to Assignment 2 requirements
 */

/**
 * Validate username
 * - Admin username: no format requirements (hardcoded)
 * - Other users: last name + two digits (e.g., smith12)
 * - Username must be unique in the system
 */
export function validateUsername(username, isAdmin = false) {
  const errors = []

  if (!username || username.trim() === '') {
    errors.push('Username is required')
    return { valid: false, errors }
  }

  // Admin username has no format requirements
  if (isAdmin) {
    return { valid: true, errors: [] }
  }

  // Other users: last name + two digits
  const usernamePattern = /^[a-zA-Z]+\d{2}$/
  if (!usernamePattern.test(username)) {
    errors.push('Username must be lastname followed by two digits (e.g., smith12)')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate password
 * - Cannot be empty
 * - At least 6 characters
 * - Must contain at least one uppercase letter
 * - Must contain at least one lowercase letter
 * - Must contain at least one digit
 * - Password should not be displayed on the interface (use type="password")
 */
export function validatePassword(password) {
  const errors = []

  if (!password || password.trim() === '') {
    errors.push('Password is required')
    return { valid: false, errors }
  }

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate email address
 * - Format: XXX@XXX.XX
 */
export function validateEmail(email) {
  const errors = []

  if (!email || email.trim() === '') {
    errors.push('Email is required')
    return { valid: false, errors }
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    errors.push('Email must have the format XXX@XXX.XX')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate phone number
 * - Must be 10 digits
 * - First digit cannot be 0
 */
export function validatePhone(phone) {
  const errors = []

  if (!phone || phone.trim() === '') {
    errors.push('Phone number is required')
    return { valid: false, errors }
  }

  const phonePattern = /^[1-9]\d{9}$/
  if (!phonePattern.test(phone)) {
    errors.push('Phone number must be 10 digits long and first digit cannot be 0')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate flight number
 * - Format: two letters + four digits (e.g., AA1024)
 */
export function validateFlightNumber(flightNumber) {
  const errors = []

  if (!flightNumber || flightNumber.trim() === '') {
    errors.push('Flight number is required')
    return { valid: false, errors }
  }

  const flightPattern = /^[A-Z]{2}\d{4}$/
  if (!flightPattern.test(flightNumber)) {
    errors.push('Flight number must be two uppercase letters followed by 4 digits (e.g., AA1024)')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate ticket number
 * - Must be 10 digits
 */
export function validateTicketNumber(ticketNumber) {
  const errors = []

  if (!ticketNumber || ticketNumber.trim() === '') {
    errors.push('Ticket number is required')
    return { valid: false, errors }
  }

  const ticketPattern = /^\d{10}$/
  if (!ticketPattern.test(ticketNumber)) {
    errors.push('Ticket number must be 10 digits long')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate bag ID
 * - Must be 6 digits
 */
export function validateBagId(bagId) {
  const errors = []

  if (!bagId || bagId.trim() === '') {
    errors.push('Bag ID is required')
    return { valid: false, errors }
  }

  const bagIdPattern = /^\d{6}$/
  if (!bagIdPattern.test(bagId)) {
    errors.push('Bag ID must be 6 digits long')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate name
 * - Both first name and last name must be at least 2 letters
 */
export function validateName(name, fieldName = 'Name') {
  const errors = []

  if (!name || name.trim() === '') {
    errors.push(`${fieldName} is required`)
    return { valid: false, errors }
  }

  if (name.trim().length < 2) {
    errors.push(`${fieldName} must be at least 2 letters`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate ID number
 * - Must be 6 digits
 */
export function validateIdNumber(idNumber) {
  const errors = []

  if (!idNumber || idNumber.trim() === '') {
    errors.push('ID number is required')
    return { valid: false, errors }
  }

  const idPattern = /^\d{6}$/
  if (!idPattern.test(idNumber)) {
    errors.push('ID number must be 6 digits')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate airline code
 * - Must be two uppercase letters
 */
export function validateAirlineCode(code) {
  const errors = []

  if (!code || code.trim() === '') {
    errors.push('Airline code is required')
    return { valid: false, errors }
  }

  const codePattern = /^[A-Z]{2}$/
  if (!codePattern.test(code)) {
    errors.push('Airline code must be two uppercase letters (e.g., AA)')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate required field
 */
export function validateRequired(value, fieldName = 'Field') {
  const errors = []

  if (!value || (typeof value === 'string' && value.trim() === '')) {
    errors.push(`${fieldName} is required`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate gate flight information consistency
 * - Gate flight information must match passenger's flight information
 */
export function validateFlightConsistency(gateFlightNumber, passengerFlightNumber) {
  const errors = []

  if (gateFlightNumber !== passengerFlightNumber) {
    errors.push('Flight information at the gate must match passenger flight information')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
