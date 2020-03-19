export const LIST_MOVIE_SHOWTIMES = `
    select h.name, s.show_time, s.id as show_id from shows as s
    inner join halls as h
    on h.id = s.hall_id
    where s.movie_id = $1
    `;
