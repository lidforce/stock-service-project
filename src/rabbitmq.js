import amqp from 'amqplib';
let channel = null;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    console.log('Подключение к RabbitMQ');
  } catch (error) {
    console.error('Не удалось подключиться к RabbitMQ:', error);
    process.exit(1);
  }
}

async function sendMessage(queue, message) {
  if (!channel) {
    console.error('Канал RabbitMQ не установлен');
    return;
  }
  try {
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    console.log(`Сообщение отправлено в очередь "${queue}":`, message);
  } catch (error) {
    console.error('Не удалось отправить сообщение:', error);
  }
}

export { connectRabbitMQ, sendMessage };