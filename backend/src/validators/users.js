const validateUser = (data) => {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.email || !emailRegex.test(data.email)) {
    errors.push("Invalid email format.");
  }

  if (!data.password || data.password.length < 6) {
    errors.push("Password must be at least 6 characters long.");
  }

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Name is required.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = validateUser;