export const GET_MOVIE_SHOWTIMES = `
    SELECT HALL_NAME, SHOW_TIME, SHOW_ID FROM SHOWS
    INNER JOIN HALLS 
    ON HALL_ID = SHOW_HALL_ID
    WHERE SHOW_MOVIE_ID = $1 AND 
        SHOW_STATUS = 'ACTIVE'
        SHOW_TIME > $2::timestamp AND 
        SHOW_TIME < DATE_TRUNC('DAY', $2::timestamp) + INTERVAL '1 DAY' - INTERVAL '1 SECOND'
    ORDER BY HALL_NAME, SHOW_TIME
`;

export const GET_ALL_MOVIES = `
    SELECT MOVIE_ID, MOVIE_NAME AS NAME, MOVIE_TICKET_PRICE AS TICKET_PRICE FROM MOVIES
`;

export const CREATE_MOVIE = `
    INSERT INTO MOVIES (MOVIE_NAME, MOVIE_TICKET_PRICE, MOVIE_CREATED_BY, MOVIE_UPDATED_BY) VALUES ($1, $2, $3, $4)
`;

export const UPDATE_MOVIE_BY_ID = `
    UPDATE MOVIES 
    SET MOVIE_NAME = $1, 
    MOVIE_TICKET_PRICE = $2, 
    MOVIE_UPDATED_BY = $3,
    MOVIE_UPDATED_AT = $4
    WHERE MOVIE_ID = $5
`;
