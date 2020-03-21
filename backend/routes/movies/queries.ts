export const GET_MOVIE_SHOWTIMES = `
    select h.name, s.show_time, s.id as show_id from shows as s
    inner join halls as h
    on h.id = s.hall_id
    where s.movie_id = $1
`;

export const GET_ALL_MOVIES = `
    select * from movies
`;

export const CREATE_MOVIE = `
    insert into movies (name, ticket_price) values ($1, $2)
`;
