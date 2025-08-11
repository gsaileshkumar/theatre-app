import { pgTable, serial, varchar, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const roles = pgTable('ROLES', {
  roleId: serial('ROLE_ID').primaryKey(),
  roleName: varchar('ROLE_NAME', { length: 25 }).unique().notNull(),
});

export const users = pgTable('USERS', {
  userId: serial('USER_ID').primaryKey(),
  fullName: varchar('USER_FULL_NAME', { length: 50 }).notNull(),
  userName: varchar('USER_NAME', { length: 50 }).unique().notNull(),
  email: varchar('USER_EMAIL', { length: 50 }).unique().notNull(),
  password: varchar('USER_PASSWORD', { length: 100 }).notNull(),
  mobile: varchar('USER_MOBILE_NUMBER', { length: 50 }).unique().notNull(),
  role: varchar('USER_ROLE', { length: 25 }).notNull(),
  createdAt: timestamp('USER_CREATED_AT', { mode: 'date' }).defaultNow().notNull(),
  createdBy: varchar('USER_CREATED_BY', { length: 25 }).default('SIGNUP'),
  updatedAt: timestamp('USER_UPDATED_AT', { mode: 'date' }).defaultNow().notNull(),
  updatedBy: varchar('USER_UPDATED_BY', { length: 25 }).default('SIGNUP'),
});

export const seatsLayouts = pgTable('SEATSLAYOUTS', {
  layoutId: serial('LAYOUT_ID').primaryKey(),
  layout: varchar('LAYOUT', { length: 25 }).unique().notNull(),
});

export const halls = pgTable('HALLS', {
  hallId: serial('HALL_ID').primaryKey(),
  hallName: varchar('HALL_NAME', { length: 25 }).unique().notNull(),
  totalExits: integer('HALL_TOTAL_EXITS').default(2),
  totalRows: integer('HALL_TOTAL_ROWS').notNull(),
  totalColumns: integer('HALL_TOTAL_COLUMNS').notNull(),
  horizontalLayout: varchar('HALL_HORIZONTAL_LAYOUT', { length: 25 }).default('LTR'),
  verticalLayout: varchar('HALL_VERTICAL_LAYOUT', { length: 25 }).default('TTB'),
  createdAt: timestamp('HALL_CREATED_AT', { mode: 'date' }).defaultNow().notNull(),
  createdBy: integer('HALL_CREATED_BY').notNull(),
  updatedAt: timestamp('HALL_UPDATED_AT', { mode: 'date' }).defaultNow().notNull(),
  updatedBy: integer('HALL_UPDATED_BY').notNull(),
});

export const movies = pgTable('MOVIES', {
  movieId: serial('MOVIE_ID').primaryKey(),
  name: varchar('MOVIE_NAME', { length: 50 }).unique().notNull(),
  ticketPrice: integer('MOVIE_TICKET_PRICE').notNull(),
  createdAt: timestamp('MOVIE_CREATED_AT', { mode: 'date' }).defaultNow().notNull(),
  createdBy: integer('MOVIE_CREATED_BY').notNull(),
  updatedAt: timestamp('MOVIE_UPDATED_AT', { mode: 'date' }).defaultNow().notNull(),
  updatedBy: integer('MOVIE_UPDATED_BY').notNull(),
});

export const showStatuses = pgTable('SHOW_STATUSES', {
  showStatusId: serial('SHOW_STATUS_ID').primaryKey(),
  showStatus: varchar('SHOW_STATUS', { length: 25 }).unique().notNull(),
});

export const shows = pgTable('SHOWS', {
  showId: serial('SHOW_ID').primaryKey(),
  movieId: integer('SHOW_MOVIE_ID'),
  hallId: integer('SHOW_HALL_ID'),
  showTime: timestamp('SHOW_TIME', { mode: 'date' }).notNull(),
  currentStatus: varchar('SHOW_CURRENT_STATUS', { length: 25 }).default('ACTIVE'),
  createdAt: timestamp('SHOW_CREATED_AT', { mode: 'date' }).defaultNow().notNull(),
  createdBy: integer('SHOW_CREATED_BY').notNull(),
  updatedAt: timestamp('SHOW_UPDATED_AT', { mode: 'date' }).defaultNow().notNull(),
  updatedBy: integer('SHOW_UPDATED_BY').notNull(),
});

export const bookings = pgTable('BOOKINGS', {
  showId: integer('BOOKING_SHOW_ID').notNull(),
  userId: integer('BOOKING_USER_ID').notNull(),
  sequenceNumber: integer('BOOKING_SEQUENCE_NUMBER').notNull(),
  status: varchar('BOOKING_STATUS', { length: 20 }).notNull(),
  createdAt: timestamp('BOOKING_CREATED_AT', { mode: 'date' }).defaultNow().notNull(),
  createdBy: integer('BOOKING_CREATED_BY').notNull(),
  updatedAt: timestamp('BOOKING_UPDATED_AT', { mode: 'date' }).defaultNow().notNull(),
  updatedBy: integer('BOOKING_UPDATED_BY').notNull(),
});

export const bookingSummary = pgTable('BOOKING_SUMMARY', {
  id: serial('BOOKING_SUMMARY_ID').primaryKey(),
  movieId: integer('BOOKING_SUMMARY_MOVIE_ID').notNull(),
  movieName: varchar('BOOKING_SUMMARY_MOVIE_NAME', { length: 25 }).notNull(),
  showTime: timestamp('BOOKING_SUMMARY_SHOW_TIME', { mode: 'date' }).notNull(),
  userId: integer('BOOKING_SUMMARY_USER_ID').notNull(),
  showId: integer('BOOKING_SUMMARY_SHOW_ID').notNull(),
  bookedSeats: varchar('BOOKING_SUMMARY_BOOKED_SEATS', { length: 50 }).notNull(),
  confirmed: boolean('BOOKING_SUMMARY_CONFIRMED').notNull(),
  checkedIn: boolean('BOOKING_SUMMARY_CHECKED_IN').default(false),
  createdAt: timestamp('BOOKING_SUMMARY_CREATED_AT', { mode: 'date' }).defaultNow().notNull(),
  createdBy: integer('BOOKING_SUMMARY_CREATED_BY').notNull(),
  updatedAt: timestamp('BOOKING_SUMMARY_UPDATED_AT', { mode: 'date' }).defaultNow().notNull(),
  updatedBy: integer('BOOKING_SUMMARY_UPDATED_BY').notNull(),
});