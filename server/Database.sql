-- Kör denna om "gen_random_uuid()" ÄR RÖD MARKERAD FÖR DIG och byta ut till "uuid_generate_v4()" (detta är helt beroende på vilken version av postgres du har)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Skapa enum för roller
create type role as enum ('USER', 'ADMIN', 'SUPPORT');

-- Skapa enum för ticket status
create type ticket_status as enum ('NY', 'PÅGÅENDE', 'LÖST', 'STÄNGD');

CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE 
);


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
    adress VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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



-- MOCKUP DATA

-- FÖRETAG
INSERT INTO companies (name, domain) VALUES
('Godisfabriken AB', 'godisfabriken.se'),
('Sport AB', 'sportab.se');

-- ANVÄNDARE
INSERT INTO users (username, password, email, role, company_id) VALUES ('admin1', 'admin1', 'admin1@test.com', 'ADMIN', 1);
INSERT INTO users (username, password, email, role, company_id) VALUES ('admin2', 'admin2', 'admin2@test.com', 'ADMIN', 2);
INSERT INTO users (username, password, email, role, company_id) VALUES ('support1', 'support1', 'support1@test.com', 'SUPPORT', 1);
INSERT INTO users (username, password, email, role, company_id) VALUES ('support2', 'support2', 'support2@test.com', 'SUPPORT', 2);
INSERT INTO users (username, password, email, role) VALUES ('user', 'user', 'user@test.com', 'USER');


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

 -- Först lägger vi till några kundprofiler
INSERT INTO customer_profiles (email, firstname, lastname, phone, adress) VALUES
('kalle@example.com', 'Kalle', 'Karlsson', '070-1234567', 'Storgatan 1, Stockholm'),
('lisa@example.com', 'Lisa', 'Larsson', '070-2345678', 'Lillgatan 2, Göteborg'),
('johan@example.com', 'Johan', 'Johansson', '070-3456789', 'Mellangatan 3, Malmö'),
('anna@example.com', 'Anna', 'Andersson', '070-4567890', 'Kungsgatan 4, Uppsala'),
('erik@example.com', 'Erik', 'Eriksson', '070-5678901', 'Drottninggatan 5, Linköping');


-- Tickets för Godisfabriken AB
INSERT INTO tickets (customer_profile_id, status, subject, created_at, product_id) VALUES
((SELECT id FROM customer_profiles WHERE email = 'kalle@example.com'), 'NY', 'Problem med Geléhallon', NOW() - INTERVAL '2 days',
 (SELECT id FROM products WHERE name = 'Geléhallon')),

((SELECT id FROM customer_profiles WHERE email = 'lisa@example.com'), 'PÅGÅENDE', 'Fråga om Chokladpraliner', NOW() - INTERVAL '5 days',
 (SELECT id FROM products WHERE name = 'Chokladpraliner')),

((SELECT id FROM customer_profiles WHERE email = 'johan@example.com'), 'LÖST', 'Allergisk reaktion från Sura Colanappar', NOW() - INTERVAL '10 days',
 (SELECT id FROM products WHERE name = 'Sura Colanappar')),

((SELECT id FROM customer_profiles WHERE email = 'anna@example.com'), 'STÄNGD', 'Leveransproblem med Colastänger', NOW() - INTERVAL '15 days',
 (SELECT id FROM products WHERE name = 'Colastänger')),

((SELECT id FROM customer_profiles WHERE email = 'erik@example.com'), 'NY', 'Fråga om ingredienser i Skumbananer', NOW() - INTERVAL '1 day',
 (SELECT id FROM products WHERE name = 'Skumbananer'));

-- Tickets för Sport AB
INSERT INTO tickets (customer_profile_id, status, subject, created_at, product_id) VALUES
((SELECT id FROM customer_profiles WHERE email = 'kalle@example.com'), 'NY', 'Fel storlek på Nike fotbollsskor', NOW() - INTERVAL '3 days',
 (SELECT id FROM products WHERE name = 'Nike fotbollsskor')),

((SELECT id FROM customer_profiles WHERE email = 'lisa@example.com'), 'PÅGÅENDE', 'Adidas tröja har gått sönder', NOW() - INTERVAL '7 days',
 (SELECT id FROM products WHERE name = 'Adidas tröja')),

((SELECT id FROM customer_profiles WHERE email = 'johan@example.com'), 'LÖST', 'Puma mössa saknas i leverans', NOW() - INTERVAL '12 days',
 (SELECT id FROM products WHERE name = 'Puma mössa')),

((SELECT id FROM customer_profiles WHERE email = 'anna@example.com'), 'STÄNGD', 'Fråga om Nike shorts material', NOW() - INTERVAL '20 days',
 (SELECT id FROM products WHERE name = 'Nike shorts')),

((SELECT id FROM customer_profiles WHERE email = 'erik@example.com'), 'NY', 'Adidas sneakers fel färg', NOW() - INTERVAL '1 day',
 (SELECT id FROM products WHERE name = 'Adidas sneakers'));

-- Lägg till några meddelanden för varje ticket
INSERT INTO messages (ticket_id, sender_type, message_text, created_at) VALUES
-- Meddelanden för Godisfabriken tickets
((SELECT id FROM tickets WHERE subject = 'Problem med Geléhallon'), 'USER', 'Hej, jag köpte geléhallon igår och de smakar konstigt.', NOW() - INTERVAL '2 days'),
((SELECT id FROM tickets WHERE subject = 'Problem med Geléhallon'), 'SUPPORT', 'Hej! Tack för din feedback. Kan du beskriva smaken mer specifikt?', NOW() - INTERVAL '1 day 23 hours'),

((SELECT id FROM tickets WHERE subject = 'Fråga om Chokladpraliner'), 'USER', 'Innehåller era chokladpraliner nötter?', NOW() - INTERVAL '5 days'),
((SELECT id FROM tickets WHERE subject = 'Fråga om Chokladpraliner'), 'SUPPORT', 'Ja, våra praliner innehåller hasselnötter. Vi har dock en nötfri variant också.', NOW() - INTERVAL '4 days'),
((SELECT id FROM tickets WHERE subject = 'Fråga om Chokladpraliner'), 'USER', 'Tack för informationen! Var kan jag hitta den nötfria varianten?', NOW() - INTERVAL '3 days'),

((SELECT id FROM tickets WHERE subject = 'Allergisk reaktion från Sura Colanappar'), 'USER', 'Jag fick utslag efter att ha ätit era colanappar. Vilka färgämnen använder ni?', NOW() - INTERVAL '10 days'),
((SELECT id FROM tickets WHERE subject = 'Allergisk reaktion från Sura Colanappar'), 'SUPPORT', 'Vi beklagar detta! Vi använder E102, E110 och E122. Dessa kan orsaka reaktioner hos känsliga personer.', NOW() - INTERVAL '9 days'),
((SELECT id FROM tickets WHERE subject = 'Allergisk reaktion från Sura Colanappar'), 'USER', 'Tack för informationen. Jag ska undvika dessa i framtiden.', NOW() - INTERVAL '8 days'),

-- Meddelanden för Sport AB tickets
((SELECT id FROM tickets WHERE subject = 'Fel storlek på Nike fotbollsskor'), 'USER', 'Jag beställde storlek 43 men fick 41. Hur gör jag för att byta?', NOW() - INTERVAL '3 days'),
((SELECT id FROM tickets WHERE subject = 'Fel storlek på Nike fotbollsskor'), 'SUPPORT', 'Vi beklagar misstaget! Skicka tillbaka skorna med retursedeln så skickar vi rätt storlek.', NOW() - INTERVAL '2 days 12 hours'),

((SELECT id FROM tickets WHERE subject = 'Adidas tröja har gått sönder'), 'USER', 'Min nya Adidas tröja gick sönder i sömmen efter första tvätten.', NOW() - INTERVAL '7 days'),
((SELECT id FROM tickets WHERE subject = 'Adidas tröja har gått sönder'), 'SUPPORT', 'Det låter inte bra! Kan du skicka en bild på skadan?', NOW() - INTERVAL '6 days'),
((SELECT id FROM tickets WHERE subject = 'Adidas tröja har gått sönder'), 'USER', 'Här är bilden på den trasiga sömmen.', NOW() - INTERVAL '5 days 12 hours'),
((SELECT id FROM tickets WHERE subject = 'Adidas tröja har gått sönder'), 'SUPPORT', 'Tack för bilden. Vi skickar en ny tröja till dig. Du behöver inte returnera den trasiga.', NOW() - INTERVAL '5 days');

-- Lägg till feedback för några avslutade ärenden
INSERT INTO feedback (ticket_id, rating, comment, created_at) VALUES
((SELECT id FROM tickets WHERE subject = 'Allergisk reaktion från Sura Colanappar'), 4, 'Bra och snabb hjälp med min fråga!', NOW() - INTERVAL '7 days'),
((SELECT id FROM tickets WHERE subject = 'Leveransproblem med Colastänger'), 3, 'Okej service, men tog lite tid att lösa problemet.', NOW() - INTERVAL '14 days'),
((SELECT id FROM tickets WHERE subject = 'Puma mössa saknas i leverans'), 5, 'Utmärkt service! Fick en ny mössa skickad direkt.', NOW() - INTERVAL '11 days'),
((SELECT id FROM tickets WHERE subject = 'Fråga om Nike shorts material'), 2, 'Fick olika svar från olika supportpersonal.', NOW() - INTERVAL '19 days');
