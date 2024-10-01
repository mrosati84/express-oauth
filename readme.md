# Demo

```
$ npm i
$ node index.js
```

Client e secret sono nel `.env`.

URL:

- Richiesta token: `http://localhost:3000/oauth/token`
- Endpoint protetto: `http://localhost:3000/api/protected`

# Richiedere un token

Occhio che e' configurato per avere il payload nel body (se usi postman, va settato esplicitamente).

curl -X POST http://localhost:3000/oauth/token -H "Content-Type: application/x-www-form-urlencoded" -d "grant_type=client_credentials&client_id=client1&client_secret=secret1"

# Chiamata protetta

Usa il token generato prima

curl --location 'localhost:3000/api/protected' --header 'Authorization: Bearer fa9b10059796117b1d4f4998ef21c0eee4f03a46febbd9d8e9f5ce0a98304024'
