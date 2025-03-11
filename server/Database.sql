-- Skapa enum för roller
create type role as enum ('USER', 'ADMIN', 'SUPPORT');

-- Skapa enum för ticket status
create type ticket_status as enum ('NY', 'PÅGÅENDE', 'LÖST', 'STÄNGD');


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role role NOT NULL
);


CREATE TABLE customer_profiles (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255),
    phone VARCHAR(50),
    adress VARCHAR(255)
);

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    customer_profile_id INTEGER REFERENCES customer_profiles(id), 
    assigned_user_id INTEGER REFERENCES users(id),
    status ticket_status NOT NULL DEFAULT 'NY',
    subject VARCHAR(255) NOT NULL,
    chat_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    product_id INTEGER REFERENCES products(id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id),
    sender_type role NOT NULL, -- 'USER', 'ADMIN'
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE 
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_id INTEGER REFERENCES companies(id)
);

CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, email, role) VALUES ('admin', 'admin', 'admin@test.com', 'ADMIN');
INSERT INTO users (username, password, email, role) VALUES ('support1', 'support1', 'support1@test.com', 'SUPPORT');
INSERT INTO users (username, password, email, role) VALUES ('user', 'user', 'user@test.com', 'USER');