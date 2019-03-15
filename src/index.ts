
import { getEnv } from './getEnv';
import { log } from 'console';
import { createChannel, assertExchange, assertQueue, messageConsumer, messagePublisher, connect } from './broker';

const brokerUrl = getEnv('MESSAGE_BROKER_URL');

const listen = async () => {
    try {
        const connection = await connect(brokerUrl);
        const channel = await createChannel(connection);

        await assertExchange(channel, 'PUBLISHING', 'direct', { durable: true });
        await assertQueue(channel, 'PUBLISHING', 'VALIDATE', 'update', { durable: true });

        await assertExchange(channel, 'PROCESSING', 'direct', { durable: true });
        await assertQueue(channel, 'PROCESSING', 'TO_PROCESS', 'process', { durable: true });

        const pushUpdate = messagePublisher(channel, 'PUBLISHING', 'update');
        const process = messagePublisher(channel, 'PROCESSING', 'process');

        messageConsumer(channel, 'VALIDATE', async ({ id, hello }) => {
            log('validating');
            log(id, hello);
            process({
                id,
                hello,
                world: 'world',
            });
        });

        messageConsumer(channel, 'TO_PROCESS', async ({ id, hello, world }) => {
            log('processing');
            log(id, hello, world);
        });

        pushUpdate({
            id: 123,
            hello: 'hello',
        });

    } catch (error) {
        log(error);
        process.exit(1);
    }
};

listen();
