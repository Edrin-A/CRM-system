-- Kör denna om "gen_random_uuid()" ÄR RÖD MARKERAD FÖR DIG och byta ut till "uuid_generate_v4()" (detta är helt beroende på vilken version av postgres du har)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Skapa enum för roller
create type role as enum ('USER', 'ADMIN', 'SUPPORT');

-- Skapa enum för ticket status
create type ticket_status as enum ('NY', 'PÅGÅENDE', 'LÖST', 'STÄNGD');


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role role NOT NULL,
    company_id INTEGER REFERENCES companies(id)
);


CREATE TABLE customer_profiles (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    firstname VARCHAR(255),
    lastname VARCHAR(255),
    phone VARCHAR(50),
    adress VARCHAR(255)
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
    sender_type role NOT NULL, -- 'USER', 'ADMIN', 'SUPPORT'
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, email, role) VALUES ('admin', 'admin', 'admin@test.com', 'ADMIN');
INSERT INTO users (username, password, email, role, company_id) VALUES ('support1', 'support1', 'support1@test.com', 'SUPPORT', 1);
INSERT INTO users (username, password, email, role, company_id) VALUES ('support2', 'support2', 'support2@test.com', 'SUPPORT', 2);
INSERT INTO users (username, password, email, role) VALUES ('user', 'user', 'user@test.com', 'USER');


INSERT INTO companies (name, domain) VALUES
('Godisfabriken AB', 'godisfabriken.se'),
('Sport AB', 'sportab.se');


-- Lägg till produkter för Godisfabriken AB
INSERT INTO products (name, description, company_id) VALUES
('Geléhallon', 'Saftiga geléhallon med äkta hallonsmak',
 (SELECT id FROM companies WHERE name = 'Godisfabriken AB')),
('Chokladpraliner', 'Handgjorda praliner med mjölkchoklad och hasselnötsfyllning',
 (SELECT id FROM companies WHERE name = 'Godisfabriken AB')),
('Sura Colanappar', 'Syrliga colanappar med intensiv smak',
 (SELECT id FROM companies WHERE name = 'Godisfabriken AB')),
('Colastänger', 'Klassiska colastängar',
 (SELECT id FROM companies WHERE name = 'Godisfabriken AB')),
('Skumbananer', 'Mjuka skumbananer med chokladöverdrag',
 (SELECT id FROM companies WHERE name = 'Godisfabriken AB'));


-- Lägg till produkter för Sport AB
INSERT INTO products (name, description, company_id) VALUES
('Nike fotbollsskor', 'Professionella fotbollsskor för gräsplan',
 (SELECT id FROM companies WHERE name = 'Sport AB')),
('Adidas tröja', 'Skön Adidas tröja',
 (SELECT id FROM companies WHERE name = 'Sport AB')),
('Puma mössa', 'Perfekt mössa för kallt väder',
 (SELECT id FROM companies WHERE name = 'Sport AB')),
('Nike shorts', 'Shorts för dig som gillar att vara aktiv',
 (SELECT id FROM companies WHERE name = 'Sport AB')),
('Adidas sneakers', 'Sneakers med stil',
 (SELECT id FROM companies WHERE name = 'Sport AB'));