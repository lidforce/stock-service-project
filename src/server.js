import express from 'express';
import bodyParser from 'body-parser';
import {PrismaClient} from '@prisma/client';
import { sendMessage, connectRabbitMQ } from './rabbitmq.js';

const prisma = new PrismaClient();
const app = express();
const PORT =  process.env.PORT;
app.use(bodyParser.json());

app.listen(PORT, () => {
  console.log(`Сервер запущен по URL: http://localhost:${PORT}`);
});

connectRabbitMQ().catch((error) => {
  console.error('Error connecting to RabbitMQ:', error);
});

app.post('/shop', async (req, res) => {
  const { name } = req.body;

  try {
    const shop = await prisma.shop.create({
      data: { name },
    });
    await sendMessage('action-queue', {
      shopId: shop.id,
      action: 'create_shop',
      details: { name },
      date: new Date(),
    });

    res.status(201).json(shop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/products', async (req, res) => {
  const { plu, name } = req.body;
  
  try {
    const product = await prisma.product.create({
      data: { plu, name },
    });

    await sendMessage('action-queue', {
      productId: product.shopId,
      action: 'create_product',
      details: { plu, name },
      date: new Date(),
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/stocks', async (req, res) => {
  const { shopId, productId, on_shelf, in_order } = req.body;

  try {
    const stock = await prisma.stock.create({
      data: {
        shopId,
        productId,
        on_shelf,
        in_order,
      },
    });

    await sendMessage('action-queue', {
      stockId: stock.id,
      action: 'create_stock',
      details: { shopId, productId, on_shelf, in_order },
      date: new Date(),
    });

    res.status(201).json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/stocks/:id/increase', async (req, res) => {
  const { id } = req.params;
  const { on_shelf } = req.body;

  try {
    const stock = await prisma.stock.update({
      where: { id: parseInt(id) },
      data: { on_shelf: { increment: on_shelf } },
    });

    await sendMessage('action-queue', {
      shopId: stock.shopId,
      plu: stock.product.plu,
      action: 'stock_increase',
      details: { amount: on_shelf },
      date: new Date(),
    });

    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/stocks/:id/decrease', async (req, res) => {
  const { id } = req.params;
  const { on_shelf } = req.body;

  try {
    const stock = await prisma.stock.update({
      where: { id: parseInt(id) },
      data: { on_shelf: { decrement: on_shelf } },
    });

    await sendMessage('action-queue', {
      shopId: stock.shopId,
      plu: stock.product.plu,
      action: 'stock_decrease',
      details: { amount: on_shelf },
      date: new Date(),
    });

    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/stocks', async (req, res) => {
  const { plu, shop_id, on_shelf_min, on_shelf_max, in_order_min, in_order_max } = req.query;

  try {
    const stocks = await prisma.stock.findMany({
      where: {
        product: plu ? { plu } : undefined,
        shopId: shop_id ? parseInt(shop_id) : undefined,
        on_shelf: {
          gte: on_shelf_min ? parseInt(on_shelf_min) : undefined,
          lte: on_shelf_max ? parseInt(on_shelf_max) : undefined,
        },
        in_order: {
          gte: in_order_min ? parseInt(in_order_min) : undefined,
          lte: in_order_max ? parseInt(in_order_max) : undefined,
        },
      },
      include: { product: true, shop: true },
    });

    await sendMessage('action-queue', {
      action: 'get_stocks',
      details: { plu, shop_id, on_shelf_min, on_shelf_max, in_order_min, in_order_max },
      date: new Date(),
    });

    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/products', async (req, res) => {
  const { name, plu } = req.query;

  try {
    const products = await prisma.product.findMany({
      where: {
        name: name ? { contains: name } : undefined,
        plu: plu ? { contains: plu } : undefined,
      },
    });

    await sendMessage({
      action: 'get_products',
      details: { name, plu },
      date: new Date(),
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});