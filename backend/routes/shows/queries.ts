export const GET_ALL_SHOWS = `
    SELECT MOVIE_NAME AS NAME, MOVIE_TICKET_PRICE AS TICKET_PRICE, MOVIE_ID FROM SHOWS 
    INNER JOIN MOVIES 
    ON SHOW_MOVIE_ID = MOVIE_ID
    WHERE SHOW_CURRENT_STATUS = 'ACTIVE' AND SHOW_TIME > NOW() AND SHOW_TIME < NOW() + INTERVAL '5 DAYS'
    GROUP BY MOVIE_NAME, MOVIE_TICKET_PRICE, MOVIE_ID
`;

export const CREATE_SHOW = `
    INSERT INTO SHOWS (SHOW_MOVIE_ID, SHOW_HALL_ID, SHOW_TIME, SHOW_CREATED_BY, SHOW_UPDATED_BY, SHOW_CURRENT_STATUS) 
    VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
`;

export const UPDATE_SHOW_BY_ID = `
    UPDATE SHOWS 
    SET SHOW_MOVIE_ID = $1, 
    SHOW_HALL_ID = $2, 
    SHOW_TIME = $3, 
    SHOW_UPDATED_BY= $4,
    SHOW_UPDATED_AT = NOW(),
    SHOW_CURRENT_STATUS = $5
    WHERE SHOW_ID = $6
`;
