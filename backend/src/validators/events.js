const validateEvent = (data) => {
  const errors = [];
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const eventDate = data.date;

  if (eventDate < oneWeekFromNow) {
    errors.push("Event date must be at least one week in the future.");
  }

  if (data.ticketTypes && Array.isArray(data.ticketTypes)) {
    const totalTickets = data.ticketTypes.reduce((sum, t) => sum + (t.available || 0), 0);
    const MAX_CAPACITY = 1000;

    if (totalTickets > MAX_CAPACITY) {
      errors.push(`Total capacity (${totalTickets}) exceeds the limit of ${MAX_CAPACITY} seats.`);
    }

    const vipTickets = data.ticketTypes[1].available;

    if(vipTickets < totalTickets * 0.1) {
      errors.push("VIP tickets must be at least 10% of the total capacity.");
    }
    if(vipTickets > totalTickets * 0.25) {
      errors.push("VIP tickets cannot exceed 25% of the total capacity.");
    }

    const standardPrice = data.ticketTypes[0].price;
    const vipPrice = data.ticketTypes[1].price;

    if (vipPrice < standardPrice * 1.5) {
      errors.push("VIP ticket price must be at least 50% higher than Standard ticket price.");
    }

    const time = data.time;
    const minutes = parseInt(time.split(":")[1], 10);
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