import consumeMessages from '../consumeMessages';
import messageHandler from '../messageHandler';
import * as amqplib from 'amqplib/callback_api';

jest.mock('amqplib/callback_api', () => ({
    connect: jest.fn((url, connectionFunc) => connectionFunc),
}));

jest.mock('../messageHandler', () => ({
    default: jest.fn(() => 'the wrapped handler'),
}));

describe('consumeMessages', () => {
    let exchange;
    let connectionFunc;
    let connection;
    let channel;
    let queues;
    let config;

    beforeEach(() => {
        exchange = {
            url: 'path/to/broker',
            name: 'assessments',
            type: 'topic',
            options: {
                durable: true,
            },
        };
        channel = {
            assertExchange: jest.fn(),
            assertQueue: jest.fn(),
            bindQueue: jest.fn(),
            prefetch: jest.fn(),
            consume: jest.fn(),
        };
        connection = {
            createChannel: jest.fn(func => func(null, channel)),
        };
        queues = [{
            name: 'my-queue',
            key: 'a.routing.key',
            handler: jest.fn(),
            options: {
                some: 'option',
            },
        }];
        config = { exchange, queues };
    });

    describe('connection', () => {
        beforeEach(() => {
            connectionFunc = consumeMessages(config);
            connectionFunc(null, connection);
        });

        it('creates a connection', () => {
            expect(amqplib.connect).toHaveBeenCalledWith('path/to/broker', connectionFunc);
        });

        it('creates a channel', () => {
            expect(connection.createChannel).toHaveBeenCalled();
        });

        it('asserts that the exchange exists', () => {
            expect(channel.assertExchange)
            .toHaveBeenCalledWith('assessments', 'topic', { durable: true });
        });
    });

    describe('for each queue', () => {
        describe('when a queue handler is not given', () => {
            beforeEach(() => {
                connectionFunc = consumeMessages(config);
                connectionFunc(null, connection);
            });

            it('asserts that the queue exists', () => {
                expect(channel.assertQueue).toHaveBeenCalledWith('my-queue', { some: 'option' });
            });

            it('binds the queue to the exchange', () => {
                expect(channel.bindQueue)
                    .toHaveBeenCalledWith('my-queue', 'assessments', 'a.routing.key');
            });

            it('sets the prefetch value', () => {
                expect(channel.prefetch).toHaveBeenCalledWith(1);
            });

            it('wraps the queue handler', () => {
                expect(messageHandler).toHaveBeenCalledWith(channel, queues[0].handler);
            });

            it('consumes the queue', () => {
                expect(channel.consume).toHaveBeenCalledWith('my-queue', 'the wrapped handler', { noAck: false });
            });
        });

        describe('when a queue handler is not given', () => {
            beforeEach(() => {
                config.queues = [{
                    name: 'my-queue',
                    key: 'a.routing.key',
                    options: {
                        some: 'option',
                    },
                }];
                connectionFunc = consumeMessages(config);
                connectionFunc(null, connection);
            });

            it('asserts that the queue exists', () => {
                expect(channel.assertQueue).toHaveBeenCalledWith('my-queue', { some: 'option' });
            });

            it('binds the queue to the exchange', () => {
                expect(channel.bindQueue)
                    .toHaveBeenCalledWith('my-queue', 'assessments', 'a.routing.key');
            });

            it('does not set the prefetch value', () => {
                expect(channel.prefetch).not.toHaveBeenCalled();
            });

            it('does not consume the queue', () => {
                expect(channel.consume).not.toHaveBeenCalled();
            });
        });
    });

});
