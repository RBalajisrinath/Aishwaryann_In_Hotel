import Joi from 'joi';

export const validateUser = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().min(1).trim(),
    lastName: Joi.string().required().min(1).trim(),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8),
    phone: Joi.string().pattern(/^[0-9+\-\s()]{10,}$/).required(),
    address: Joi.string().optional().allow('').trim()
  });

  return schema.validate(data);
};

export const validateHotel = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().min(3),
    city: Joi.string().required(),
    state: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().required(),
    description: Joi.string().required(),
    amenities: Joi.array().items(Joi.string())
  });

  return schema.validate(data);
};

export const validateRoom = (data) => {
  const schema = Joi.object({
    hotelId: Joi.number().required(),
    type: Joi.string().valid('single', 'double', 'suite', 'deluxe').required(),
    pricePerNight: Joi.number().positive().required(),
    capacity: Joi.number().positive().required(),
    totalRooms: Joi.number().positive().required(),
    description: Joi.string(),
    amenities: Joi.array().items(Joi.string())
  });

  return schema.validate(data);
};

export const validateBooking = (data) => {
  const schema = Joi.object({
    roomId: Joi.number().required(),
    checkInDate: Joi.date().iso().required(),
    checkOutDate: Joi.date().iso().required(),
    numberOfGuests: Joi.number().positive().required(),
    numberOfRooms: Joi.number().positive().min(1).max(10).default(1),
    specialRequests: Joi.string()
  });

  return schema.validate(data);
};

export const validateBill = (data) => {
  const schema = Joi.object({
    bookingId: Joi.number().required(),
    subtotal: Joi.number().positive().required(),
    tax: Joi.number().min(0).required(),
    discount: Joi.number().min(0),
    totalAmount: Joi.number().positive().required(),
    notes: Joi.string()
  });

  return schema.validate(data);
};
