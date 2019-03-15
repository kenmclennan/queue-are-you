import { connect } from 'amqplib/callback_api';
import messageHandler from './messageHandler';
import { ConsumerConfig } from './types';

export default ({ exchange, queues }: ConsumerConfig) =>
    connect(exchange.url, (error, connection) => {
        connection.createChannel((error, channel) => {
            channel.assertExchange(exchange.name, exchange.type, exchange.options);
            queues.forEach((queue) => {
                channel.assertQueue(queue.name, queue.options);
                channel.bindQueue(queue.name, exchange.name, queue.key);
                if (queue.handler) {
                    channel.prefetch(1);
                    channel.consume(
                        queue.name,
                        messageHandler(channel, queue.handler),
                        { noAck: false },
                    );
                }
            });
        });
    });
