const express = require('express');
const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/api/ping', (req, res) => {
    res.json({ message: 'Сервер ИС ЖД Станция работает!' });
});

app.listen(PORT, () => {
    console.log(`Бэкенд запущен на http://localhost:${PORT}`);
});