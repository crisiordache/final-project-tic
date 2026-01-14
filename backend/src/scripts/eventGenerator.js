const { faker } = require('@faker-js/faker');


function randomTimeForEvent() {
  const hour = faker.number.int({ min: 10, max: 22 });
  const minute = faker.helpers.arrayElement(["00", "15", "30", "45"]);
  return `${hour.toString().padStart(2, "0")}:${minute}`;
}

async function generateEvents(count) {
  const events = [];

  for (let i = 0; i < count; i++) {
    events.push({
      eventId: faker.string.uuid(),
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      date: faker.date.future(),
      time: randomTimeForEvent(),

      location: {
        city: faker.location.city(),
        venue: faker.company.name()
      },

      ticketTypes: [
        {
          type: "Standard",
          price: faker.number.int({ min: 50, max: 150 }),
          available: faker.number.int({ min: 50, max: 300 })
        },
        {
          type: "VIP",
          price: faker.number.int({ min: 200, max: 400 }),
          available: faker.number.int({ min: 10, max: 50 })
        }
      ],

      organizer: {
        id: faker.string.uuid(),
        name: faker.company.name(),
        email: faker.internet.email()
      },

      isActive: faker.datatype.boolean(),
      createdAt: new Date()
    });
  }

  return events;
}

module.exports = generateEvents;