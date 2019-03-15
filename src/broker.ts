import * as amqplib from 'amqplib';

export interface MessageData {
    [propName: string]: any;
}

export interface QueueTask {
    (data: MessageData): Promise<void>;
}

export const connect = async (brokerUrl: string): Promise<amqplib.Connection> => amqplib.connect(brokerUrl);

export const createChannel = async (connection: amqplib.Connection): Promise<amqplib.Channel> =>
    connection.createChannel();

export const assertExchange = async (
    channel: amqplib.Channel,
    exchangeName: string,
    exchangeType: string,
    options: amqplib.Options.AssertExchange,
): Promise<amqplib.Replies.AssertExchange> =>
    channel.assertExchange(exchangeName, exchangeType, options);

export const assertQueue = async (
    channel: amqplib.Channel,
    exchangeName: string,
    queueName: string,
    routingKey: string,
    options: amqplib.Options.AssertQueue,
): Promise<amqplib.Replies.AssertQueue> =>
    channel.assertQueue(queueName, options).then(reply =>
        channel.bindQueue(queueName, exchangeName, routingKey).then(() => reply));

export const messagePublisher = (
    channel: amqplib.Channel,
    exchangeName: string,
    routingKey: string,
) => async (message: MessageData): Promise<void> => {
    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(message)));
};

export const messageConsumer = (
    channel: amqplib.Channel,
    queueName: string,
    handler: QueueTask,
): void => {
    channel.consume(
        queueName,
        async (message: amqplib.ConsumeMessage) => {
            try {
                await handler(JSON.parse(message.content.toString()));
                channel.ack(message);
            } catch (e) {
                channel.reject(message, false);
            }
        },
        {
            noAck: false,
        },
    );
};
