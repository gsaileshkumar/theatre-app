export const GET_ALL_SHOWS = `
    select m.name, m.ticket_price, m.id as movie_id from movies as m
    inner join shows as s
    on s.movie_id = m.id
    group by m.name, m.ticket_price, m.id
`;

export const CREATE_SHOW = `
    insert into shows (movie_id, hall_id, show_time) values ($1, $2, $3)
`;
