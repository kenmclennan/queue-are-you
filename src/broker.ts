import * as amqplib from 'amqplib';

export interface MessageData {
    [propName: string]: any;
}

export interface MessagePublisher {
    (exchangeName: string, routingKey: string, message: MessageData): void;
}

export interface QueueHandler {
    (data: MessageData, context: MessagePublisher): Promise<void>;
}

export const connect = async (brokerUrl: string): Promise<amqplib.Connection> => amqplib.connect(brokerUrl);

export const createChannel = async (connection: amqplib.Connection): Promise<amqplib.Channel> =>
    connection.createChannel();

export const declareExchange = async (
    channel: amqplib.Channel,
    exchangeName: string,
    exchangeType: string,
    options: amqplib.Options.AssertExchange,
): Promise<amqplib.Replies.AssertExchange> =>
    channel.assertExchange(exchangeName, exchangeType, options);

export const bindQueue = async (
    channel: amqplib.Channel,
    exchangeName: string,
    routingKey: string,
    queueName: string,
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
    handler: QueueHandler,
): void => {
    const forward: MessagePublisher = (exchangeName: string, routingKey: string, message: MessageData) =>
        messagePublisher(channel, exchangeName, routingKey)(message);
    channel.consume(
        queueName,
        async (message: amqplib.ConsumeMessage | null) => {
            if (message) {
                try {
                    await handler(JSON.parse(message.content.toString()), forward);
                    channel.ack(message);
                } catch (e) {
                    channel.reject(message, false);
                }
            }
        },
        {
            noAck: false,
        },
    );
};
