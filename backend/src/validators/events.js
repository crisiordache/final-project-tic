const validateEvent = (data) => {
  const errors = [];
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const eventDate = data.date;

  if (eventDate < oneWeekFromNow) {
    errors.push("Event date must be at least one week in the future.");
  }

  if (data.ticketTypes && Array.isArray(data.ticketTypes) && data.ticketTypes.length >= 2) {
    const totalTickets = data.ticketTypes.reduce((sum, t) => sum + (t.available || 0), 0);
    const MAX_CAPACITY = 1000;

    if (totalTickets > MAX_CAPACITY) {
      errors.push(`Total capacity (${totalTickets}) exceeds the limit of ${MAX_CAPACITY} seats.`);
    }

    const vipType = data.ticketTypes.find(t => t.type === "VIP");
    const standardType = data.ticketTypes.find(t => t.type === "Standard");

    if (vipType && totalTickets > 0) {
      const vipTickets = vipType.available || 0;
      if (vipTickets < totalTickets * 0.1) {
        errors.push("VIP tickets must be at least 10% of the total capacity.");
      }
      if (vipTickets > totalTickets * 0.25) {
        errors.push("VIP tickets cannot exceed 25% of the total capacity.");
      }
    }

    if (vipType && standardType) {
      if (vipType.price < standardType.price * 1.5) {
        errors.push("VIP ticket price must be at least 50% higher than Standard ticket price.");
      }
    }
  }

  if (data.time) {
    const parts = String(data.time).split(":");
    const minutes = parseInt(parts[1], 10);
    if (![0, 15, 30, 45].includes(minutes)) {
      errors.push("Event time minutes must be one of the following: 00, 15, 30, or 45.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = validateEvent;