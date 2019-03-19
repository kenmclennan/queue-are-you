
import { getEnv } from './getEnv';
import { log } from 'console';
import { createChannel, messagePublisher, connect, QueueHandler } from './broker';
import { BrokerDSL } from './brokerDSL';

const brokerUrl = getEnv('MESSAGE_BROKER_URL');

const validate: QueueHandler = async ({ id, hello }, forward) => {
    log('validating');
    log(id, hello);
    forward('PROCESSING', 'process', {
        id,
        hello,
        world: 'world',
        isValid: true,
    });
};

BrokerDSL.configure(brokerUrl, (exchange) => {
    exchange('PUBLISHING', { type: 'direct' }, (route) => {
        route('update', (queue) => {
            queue('validate', validate);
            queue('debug', async msg => log(JSON.stringify(msg, null, 4)));
            let count = 0;
            queue('counter', { durable: true }, async () => log(`I have seen ${count += 1} messages!`));
        });
    });

    exchange('PROCESSING', (route) => {
        route('process', (queue) => {
            queue('uploading', async ({ id, hello, world }) => {
                log('processing');
                log(id, hello, world);
            });
        });
    });
});
