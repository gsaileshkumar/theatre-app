export const CREATE_USER = `
    insert into users (name, email, password, created_at) values ($1, $2, $3, $4)
`;

export const GET_USER_BY_EMAIL = `
    select id, password from users where email = $1
`;
