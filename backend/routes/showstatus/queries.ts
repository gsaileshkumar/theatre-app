export const GET_SHOW_AVAILABILITY = `
    select sequence_number, status from show_status 
    where show_id  = $1`;

export const GET_HALL_DETAILS_BY_SHOW_ID = `
    select h.id as hall_id, h.name, h.total_columns, h.total_rows from shows as s
    inner join halls as h
    on s.hall_id = h.id
    where s.id = $1`;

export const CHECK_IF_ARE_SEATS_TAKEN = `
    select show_id, sequence_number, status from show_status 
    where show_id = $1
    and sequence_number = any ($2) 
    and status = 'taken' for update
`;

export const BOOK_SINGLE_TICKET = `
    INSERT INTO show_status (show_id, sequence_number, status) VALUES ($1, $2, 'taken');
`;
