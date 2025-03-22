# CRM-system
Ett komplett ärendehanteringssystem med rollbaserad behörighetskontroll där kunder kan skicka in ärenden och följa dessa via en unik chattlänk. Kundtjänstmedarbetare kan hantera inkommande ärenden och administratörer kan hantera användarkonton och systemkonfiguration. Systemet är byggt med en .NET-backend och React-frontend med Material UI för ett modernt och funktionellt användargränssnitt.

## Funktioner
### Utan att vara inloggad
- Kan skicka in ärenden
- När ett ärende skickas in får man en bekräftelse på den mail man skrev in på formuläret med en länk till sitt ärende
- Kan logga in

### Som kund
- Kan komma åt sitt ärende via en unik chatt-token
- Kan skicka meddelanden till kundtjänstmedarbetare 
- Kan lämna feedback när ärendet är stängt

### Inloggad som kundtjänstmedarbetare (SUPPORT-roll) 
- Kan se alla aktiva ärenden i ärendelistan
- Kan filtrera ärende utifrån deras status
- Kan uppdatera status på ärenden (NY, PÅGÅENDE, LÖST, STÄNGD)
- Kan kommunicera med kunder via meddelandesystemet
- Kan ändra sitt lösenord
- Kan logga ut från systemet

### Inloggad som administratör (ADMIN-roll)
- Har alla rättigheter som kundtjänstmedarbetare har
- Har en adminstratörspanel
- Kan hantera alla kundtjänstmedarbetare (lägga till, ändra och ta bort)
- Kan hantera företags och produktinformation (lägga till, ändra och ta bort)




## För att starta programmet, följ dessa instruktioner:
Förutsättningar
- .NET 6 eller senare installerat
- Node.js och npm installerade
- PostgreSQL databasserver

## Få igång programmet:
1. Klona projektet eller ladda ner det lokalt
2. Skapa en PostgreSQL-databas för applikationen
3. Öppna query konsol till din databas
4. Gå till server/Database.sql 
5. Här ser du alla queries som skapar alla tabeller och relationer till dig. Det finns även mockdata. Kopiera allt och lägg in i din query konsol och kör allt samtidigt. (OBS! kolla längst upp i filen om du har problem med gen_random_uuid())
6. Uppdatera databasanslutningen i server/Config/Database.cs med dina PostgreSQL-uppgifter
7. Öppna server/appsettings.json och uppdatera e-postkonfigurationen till dina (om du vill ha en annan mail som skickar alla mail)
8. Öppna terminalen och navigera till server mappen: 
- Kör: **dotnet restore** (För att återställa alla NuGet-paketberoenden som projektet kräver genom att ladda ner och installera dem enligt vad som specificerats i projektfilen)
- Kör: **dotnet run** (För att starta servern, får du problem här så borde du checka att du har kopplat rätt på punkt 6.)
9. Öppna en ny terminal där du navigerar till client mappen:
- Kör: **npm install** (För att installera beroende)
- Kör: **npm run dev** (För att starta frontenden)
10. Gå in på http://localhost:3000
11. (Du har inloggnings uppgifter i users tabellen i din databas om du lade till all mockup data från Database.sql)
