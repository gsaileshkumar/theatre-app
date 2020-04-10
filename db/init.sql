-- DROP TABLE HALLS, MOVIES, SHOWS, SEATSLAYOUTS, BOOKINGS, ROLES, USERS, BOOKING_SUMMARY;

CREATE TABLE ROLES (
	ROLE_ID SERIAL PRIMARY KEY,
	ROLE_NAME VARCHAR(25) UNIQUE NOT NULL
);

CREATE TABLE USERS (
	USER_ID SERIAL PRIMARY KEY,
	USER_FULL_NAME VARCHAR(50) NOT NULL,
	USER_NAME VARCHAR(50) UNIQUE NOT NULL,
	USER_EMAIL VARCHAR(50) UNIQUE NOT NULL,
	USER_PASSWORD VARCHAR(100) NOT NULL,
	USER_MOBILE_NUMBER VARCHAR(50) UNIQUE NOT NULL,
	USER_ROLE VARCHAR(25) REFERENCES ROLES(ROLE_NAME) NOT NULL,
	USER_CREATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	USER_CREATED_BY VARCHAR(25) DEFAULT 'SIGNUP',
	USER_UPDATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	USER_UPDATED_BY VARCHAR(25) DEFAULT 'SIGNUP'
);

CREATE TABLE SEATSLAYOUTS (
	LAYOUT_ID SERIAL PRIMARY KEY,
	LAYOUT VARCHAR(25) UNIQUE NOT NULL
);

CREATE TABLE HALLS (
	HALL_ID SERIAL PRIMARY KEY,
	HALL_NAME VARCHAR(25) UNIQUE NOT NULL,
	HALL_TOTAL_EXITS INT DEFAULT 2,
	HALL_TOTAL_ROWS INT NOT NULL,
	HALL_TOTAL_COLUMNS INT NOT NULL,
	HALL_HORIZONTAL_LAYOUT VARCHAR(25) REFERENCES SEATSLAYOUTS(LAYOUT) DEFAULT 'LTR',
	HALL_VERTICAL_LAYOUT VARCHAR(25) REFERENCES SEATSLAYOUTS(LAYOUT) DEFAULT 'TTB',
	HALL_CREATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	HALL_CREATED_BY INT REFERENCES USERS(USER_ID) NOT NULL,
	HALL_UPDATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	HALL_UPDATED_BY INT REFERENCES USERS(USER_ID) NOT NULL
);

CREATE TABLE MOVIES (
	MOVIE_ID SERIAL PRIMARY KEY,
	MOVIE_NAME VARCHAR(50) UNIQUE NOT NULL,
	MOVIE_TICKET_PRICE INT NOT NULL,
	MOVIE_CREATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	MOVIE_CREATED_BY INT REFERENCES USERS(USER_ID) NOT NULL,
	MOVIE_UPDATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	MOVIE_UPDATED_BY INT REFERENCES USERS(USER_ID) NOT NULL
);

CREATE TABLE SHOWS (
	SHOW_ID SERIAL PRIMARY KEY,
	SHOW_MOVIE_ID INT REFERENCES MOVIES(MOVIE_ID),
	SHOW_HALL_ID INT REFERENCES HALLS(HALL_ID),
	SHOW_TIME TIMESTAMP NOT NULL,
	SHOW_CREATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	SHOW_CREATED_BY INT REFERENCES USERS(USER_ID) NOT NULL,
	SHOW_UPDATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	SHOW_UPDATED_BY INT REFERENCES USERS(USER_ID) NOT NULL
);

CREATE TABLE BOOKINGS (
	BOOKING_SHOW_ID INT REFERENCES SHOWS(SHOW_ID) NOT NULL,
	BOOKING_USER_ID INT REFERENCES USERS(USER_ID) NOT NULL,
	BOOKING_SEQUENCE_NUMBER INT NOT NULL,
	BOOKING_STATUS VARCHAR(20) NOT NULL,
	BOOKING_CREATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	BOOKING_CREATED_BY INT REFERENCES USERS(USER_ID) NOT NULL,
	BOOKING_UPDATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	BOOKING_UPDATED_BY INT REFERENCES USERS(USER_ID) NOT NULL,
	UNIQUE(BOOKING_SHOW_ID, BOOKING_SEQUENCE_NUMBER)
);

CREATE TABLE BOOKING_SUMMARY (
	BOOKING_SUMMARY_ID SERIAL PRIMARY KEY,
	BOOKING_SUMMARY_MOVIE_ID INT REFERENCES MOVIES(MOVIE_ID) NOT NULL,
	BOOKING_SUMMARY_MOVIE_NAME VARCHAR(25) NOT NULL,
	BOOKING_SUMMARY_USER_ID INT REFERENCES USERS(USER_ID) NOT NULL,
	BOOKING_SUMMARY_SHOW_ID INT REFERENCES SHOWS(SHOW_ID) NOT NULL,
	BOOKING_SUMMARY_BOOKED_SEATS VARCHAR(50) NOT NULL,
	BOOKING_SUMMARY_CONFIRMED BOOLEAN NOT NULL,
	BOOKING_SUMMARY_CHECKED_IN BOOLEAN DEFAULT FALSE,
	BOOKING_SUMMARY_CREATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	BOOKING_SUMMARY_CREATED_BY INT REFERENCES USERS(USER_ID) NOT NULL,
	BOOKING_SUMMARY_UPDATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
	BOOKING_SUMMARY_UPDATED_BY INT REFERENCES USERS(USER_ID) NOT NULL
)

TRUNCATE HALLS, MOVIES, SHOWS, BOOKINGS, ROLES, USERS, SEATSLAYOUTS, BOOKING_SUMMARY RESTART IDENTITY;

INSERT INTO ROLES (ROLE_NAME) VALUES ('ADMIN');
INSERT INTO ROLES (ROLE_NAME) VALUES ('USER');

INSERT INTO USERS (USER_NAME, USER_FULL_NAME, USER_EMAIL, USER_PASSWORD, USER_MOBILE_NUMBER, USER_ROLE, USER_CREATED_BY, USER_UPDATED_BY) VALUES ('ADMIN', 'ADMIN', 'ADMIN@ADMIN.COM', '$2b$10$JDiXQ0buQecsIO3Iq7Y6CuRy7tbMNHMYtv77cW01G8c1vrNMBFE2S', '1234567890','ADMIN', 'ADMIN', 'ADMIN');


INSERT INTO SEATSLAYOUTS (LAYOUT) VALUES ('LTR');
INSERT INTO SEATSLAYOUTS (LAYOUT) VALUES ('RTL');
INSERT INTO SEATSLAYOUTS (LAYOUT) VALUES ('TTB');
INSERT INTO SEATSLAYOUTS (LAYOUT) VALUES ('BTT');

INSERT INTO HALLS (HALL_NAME, HALL_TOTAL_COLUMNS, HALL_TOTAL_ROWS, HALL_CREATED_BY, HALL_UPDATED_BY) VALUES ('HALL1', 20, 10, 1, 1);
INSERT INTO HALLS (HALL_NAME, HALL_TOTAL_COLUMNS, HALL_TOTAL_ROWS, HALL_CREATED_BY, HALL_UPDATED_BY) VALUES ('HALL2', 20, 8, 1, 1);

INSERT INTO MOVIES (MOVIE_NAME, MOVIE_TICKET_PRICE, MOVIE_CREATED_BY, MOVIE_UPDATED_BY) VALUES ('NAYAGI', 180, 1, 1);
INSERT INTO MOVIES (MOVIE_NAME, MOVIE_TICKET_PRICE, MOVIE_CREATED_BY, MOVIE_UPDATED_BY) VALUES ('BIGIL', 120, 1, 1);
INSERT INTO MOVIES (MOVIE_NAME, MOVIE_TICKET_PRICE, MOVIE_CREATED_BY, MOVIE_UPDATED_BY) VALUES ('VISWASAM', 150, 1, 1);

INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (2, 1, DATE_TRUNC('day', NOW() ) + INTERVAL '15 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (2, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '11 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (2, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '20 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (2, 1, DATE_TRUNC('day', NOW() ) + INTERVAL '23 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (3, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '10 HOURS 00 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (3, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '16 HOURS 00 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (3, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '22 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (1, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '09 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (1, 1, DATE_TRUNC('day', NOW() ) + INTERVAL '08 HOURS 00 MINUTES', 1, 1);

INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (2, 1, DATE_TRUNC('day', NOW() ) + INTERVAL '1 DAY 15 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (2, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '1 DAY 11 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (2, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '1 DAY 20 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (2, 1, DATE_TRUNC('day', NOW() ) + INTERVAL '1 DAY 23 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (3, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '1 DAY 10 HOURS 00 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (3, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '1 DAY 16 HOURS 00 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (3, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '1 DAY 22 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (1, 2, DATE_TRUNC('day', NOW() ) + INTERVAL '1 DAY 09 HOURS 30 MINUTES', 1, 1);
INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY) VALUES (1, 1, DATE_TRUNC('day', NOW() ) + INTERVAL '1 DAY 08 HOURS 00 MINUTES', 1, 1);

