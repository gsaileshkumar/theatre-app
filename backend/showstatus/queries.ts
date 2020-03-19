export const GET_SHOW_AVAILABILITY = `
    select sequence_number, status from show_status 
    where show_id  = $1`;

export const GET_HALL_DETAILS_BY_SHOW_ID = `
    select h.id as hall_id, h.name, h.total_columns, h.total_rows from shows as s
    inner join halls as h
    on s.hall_id = h.id
    where s.id = $1`;
