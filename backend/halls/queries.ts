export const CREATE_HALL = `
    insert into halls (name, total_columns, total_rows) values ($1, $2, $3)
    `;

export const GET_ALL_HALLS = `
    select * from halls
`;
