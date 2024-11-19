# Сервис остатков товаров в магазине

## Установка
1. `git clone https://github.com/lidforce/stock-service-project.git`
2. Ввести `npm install`
3. Создать базу данных PostgreSQL и заменить значения переменных окружения в файле `.env`
4. Запустить установку RabbitMQ через Docker командой `npm run rabbitmq:start` 
5. Для миграции схемы базы данных: `npm run prisma:migrate`
6. Следовать установке [history-service](https://github.com/lidforce/history-service-project)
7. `npm run dev` или `npm start`


## API

### Создание магазина
```bash
curl -X POST http://localhost:3000/shop \
-H "Content-Type: application/json" \
-d '{
  "name": "Название магазина"
}'
```
### Создание товара

```bash
curl -X POST http://localhost:3000/products \
-H "Content-Type: application/json" \
-d '{
  "plu": "101010",
  "name": "Название товара"
}'
```

### Создание остатка

```bash
curl -X POST http://localhost:3000/stocks \
-H "Content-Type: application/json" \
-d '{
  "shopId": 1,
  "productId": 1,
  "on_shelf": 10,
  "in_order": 0
}'
```

### Увеличение остатка

```bash
curl -X PATCH http://localhost:3000/stocks/1/increase \
-H "Content-Type: application/json" \
-d '{
  "on_shelf": 1
}'
```

### Уменьшение остатка

```bash
curl -X PATCH http://localhost:3000/stocks/1/decrease \
-H "Content-Type: application/json" \
-d '{
  "on_shelf": 1
}'
```

### Получение остатков
Запрос по фильтру:
```bash 
curl -X GET "http://localhost:3000/stocks?plu=12345&shop_id=1&on_shelf_min=10&on_shelf_max=100"
```

Запрос без фильтра:
```bash
curl -X GET http://localhost:3000/stocks
```

### Получение товаров
Запрос по фильтру:
```bash
curl -X GET "http://localhost:3000/products?name=Кофе"
```

Запрос без фильтра:
```bash
curl -X GET http://localhost:3000/products
```
