
import * as amqplib from 'amqplib';
import { connect, createChannel, declareExchange, bindQueue, QueueHandler, messageConsumer } from './broker';

export namespace BrokerDSL {
    interface QueuesConfig {
        (queue: (
            queueName: string,
            ...options: [amqplib.Options.AssertQueue, QueueHandler] | [amqplib.Options.AssertQueue] | [QueueHandler]
        ) => void): void;
    }

    interface RoutesConfig {
        (route: (routingKey: string, queuesConfig: QueuesConfig) => void): void;
    }
    interface ExchangeConfig {
        (exchange:
            (exchangeName: string, ...config: [RoutesConfig] | [ExchangeConfigOptions, RoutesConfig]) => void,
        ): void;
    }

    interface ExchangeConfigOptions {
        type: string;
        options?: amqplib.Options.AssertExchange;
    }

    const defaultExchangeConfig: ExchangeConfigOptions = {
        type: 'direct',
        options: {},
    };

    export const configure = async (brokerUrl: string, exchangeConfig: ExchangeConfig): Promise<void> => {
        const connection = await connect(brokerUrl);
        const channel = await createChannel(connection);
        exchangeConfig((
            exchangeName: string,
            ...options: [RoutesConfig] | [ExchangeConfigOptions, RoutesConfig]
        ): void => {
            const [exchangeConfig, routesConfig] = options.length === 2 ? options : [defaultExchangeConfig, options[0]];
            declareExchange(
                channel,
                exchangeName,
                exchangeConfig.type,
                exchangeConfig.options || {},
            ).then(() => {
                routesConfig((routingKey: string, queuesConfig: QueuesConfig) => {
                    queuesConfig((
                        queueName: string,
                        arg2?: amqplib.Options.AssertQueue | QueueHandler,
                        arg3?: QueueHandler,
                    ) => {
                        let queueOptions: amqplib.Options.AssertQueue = {};
                        let handler: QueueHandler | undefined = arg3;
                        if (arg2) {
                            if (typeof arg2 === 'function') {
                                handler = arg2;
                            } else {
                                queueOptions = arg2;
                            }
                        }
                        bindQueue(channel, exchangeName, routingKey, queueName, queueOptions).then(() => {
                            if (handler) {
                                messageConsumer(channel, queueName, handler);
                            }
                        });
                    });
                });
            });
        });
    };
}
