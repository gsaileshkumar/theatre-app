-- DROP TABLE halls, movies, shows, show_status, roles, users;

CREATE TABLE halls (
	id SERIAL PRIMARY KEY,
	name varchar(20) NOT NULL,
	total_exits INT default 2,
	total_rows INT NOT NULL,
	total_columns INT NOT NULL
);

CREATE TABLE movies (
	id SERIAL PRIMARY KEY,
	name varchar(50) UNIQUE NOT NULL,
	ticket_price INT NOT NULL
);

CREATE TABLE shows (
	id SERIAL PRIMARY KEY,
	movie_id INT REFERENCES movies(id),
	hall_id INT REFERENCES halls(id),
	show_time TIME NOT NULL
);

CREATE TABLE show_status (
	show_id INT REFERENCES shows(id) NOT NULL,
	sequence_number INT NOT NULL,
	status varchar(20) NOT NULL,
	UNIQUE(show_id, sequence_number)
);

CREATE TABLE roles (
	id SERIAL PRIMARY KEY,
	role varchar(20) unique NOT NULL
);

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name varchar(50) NOT NULL,
	email varchar(50) unique NOT NULL,
	password varchar(100) NOT NULL,
	role varchar(20) references roles(role) NOT NULL,
	created_at TIMESTAMP NOT NULL
);

TRUNCATE halls, movies, shows, show_status, roles, users RESTART IDENTITY;

INSERT INTO roles (role) VALUES ('ADMIN');
INSERT INTO roles (role) VALUES ('USER');


INSERT INTO users (name, email, password, role, created_at) VALUES ('admin', 'admin@admin.com', '$2b$10$JDiXQ0buQecsIO3Iq7Y6CuRy7tbMNHMYtv77cW01G8c1vrNMBFE2S','ADMIN', '2020-03-20 04:05:06');

INSERT INTO halls (name, total_columns, total_rows) VALUES ('hall1', 20, 10);
INSERT INTO halls (name, total_columns, total_rows) VALUES ('hall2', 20, 8);

INSERT INTO movies (name, ticket_price) VALUES ('Nayagi', 180);
INSERT INTO movies (name, ticket_price) VALUES ('Bigil', 120);
INSERT INTO movies (name, ticket_price) VALUES ('Viswasam', 150);

INSERT INTO shows (movie_id, hall_id, show_time) VALUES (2, 1, '15:30');
INSERT INTO shows (movie_id, hall_id, show_time) VALUES (2, 1, '11:30');
INSERT INTO shows (movie_id, hall_id, show_time) VALUES (2, 1, '20:30');
INSERT INTO shows (movie_id, hall_id, show_time) VALUES (2, 1, '23:30');
INSERT INTO shows (movie_id, hall_id, show_time) VALUES (3, 2, '10:00');
INSERT INTO shows (movie_id, hall_id, show_time) VALUES (3, 2, '16:00');
INSERT INTO shows (movie_id, hall_id, show_time) VALUES (3, 2, '22:00');
INSERT INTO shows (movie_id, hall_id, show_time) VALUES (1, 2, '09:00');
INSERT INTO shows (movie_id, hall_id, show_time) VALUES (1, 1, '08:00');



INSERT INTO show_status (show_id, sequence_number, status) VALUES (2, 55, 'taken');
INSERT INTO show_status (show_id, sequence_number, status) VALUES (2, 57, 'taken');
INSERT INTO show_status (show_id, sequence_number, status) VALUES (2, 56, 'taken');
