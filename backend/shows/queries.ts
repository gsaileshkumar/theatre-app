export const LIST_ALL_SHOWS = `
    select m.name, m.ticket_price, m.id as movie_id from movies as m
    inner join shows as s
    on s.movie_id = m.id
    group by m.name, m.ticket_price, m.id`;
